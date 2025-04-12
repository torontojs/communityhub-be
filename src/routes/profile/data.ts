import { DBTables, DEFAULT_TEAM_ID, generateBaseDBfields } from '../../constants/db.ts';
import { EventLog } from '../event-log/data.ts';
import type { CreateProfileData, Profile, ProfileLink, ProfileSkill, UpdateProfileData } from './validation.ts';

function transformProfile(profile: Profile) {
	const filteredProfile = Object.fromEntries(Object.entries(profile).filter(([, value]) => Boolean(value))) as Profile;

	return {
		...filteredProfile,
		isBasedOnGTA: Boolean(profile.isBasedOnGTA),
		canJoinLocalEvents: Boolean(profile.canJoinLocalEvents),
		links: profile.links ?? [],
		skills: profile.skills ?? []
	};
}

export async function insertProfile(database: D1Database, { email, name, password }: CreateProfileData) {
	const { id, schemaVersion, happenedAt, insertedAt } = generateBaseDBfields();

	const results = await database.batch([
		database.prepare(`
			INSERT INTO ${DBTables.PROFILE} (
				id, schemaVersion, happenedAt, insertedAt,
				email, name
			)
			VALUES (
				?, ?, ?, ?,
				?, ?
			)
		`).bind(
			id,
			schemaVersion,
			happenedAt,
			insertedAt,
			email,
			name
		),
		database.prepare(`
			INSERT INTO ${DBTables.ACCESS} (
				id, schemaVersion, access_level, password, email
			)
			VALUES (
				?, ?, ?, ?, ?
			)
		`).bind(id, schemaVersion, 'volunteer', password, email),
		EventLog.joinTorontoJS(database, id),
		database.prepare(`
			INSERT INTO ${DBTables.ROLE} (
				id, schemaVersion, happenedAt, insertedAt,
				name, description, teamId, profileId
			)
			VALUES (
				?, ?, ?, ?,
				?, ?, ?, ?
			)
		`).bind(
			id,
			schemaVersion,
			happenedAt,
			insertedAt,
			'volunteer',
			'Volunteer at Toronto JS',
			DEFAULT_TEAM_ID,
			id
		)
	]);

	return { success: results.every(({ success }) => success), id };
}

export async function updateProfileById(
	database: D1Database,
	id: string,
	{ name, description, isBasedOnGTA, canJoinLocalEvents, pronouns, birthday, avatar, links, skills }: UpdateProfileData
) {
	const fieldsToUpdate = Object.fromEntries(
		Object.entries({
			name,
			description,
			isBasedOnGTA,
			canJoinLocalEvents,
			pronouns,
			birthday,
			avatar
		}).filter(([, value]) => value)
	);

	const existingData = await database.batch([
		database.prepare(`SELECT url FROM ${DBTables.PROFILE_LINKS} WHERE profileId = ?`).bind(id),
		database.prepare(`SELECT skill FROM ${DBTables.PROFILE_SKILLS} WHERE profileId = ?`).bind(id)
	]);

	// Filter links to add based on existing ones.
	const existingLinks = (existingData[0]?.results as ProfileLink[] | undefined ?? []).map(({ url }) => url);
	const filteredLinks = (links ?? []).filter((url) => !existingLinks.includes(url));

	// Filter skills to add based on existing ones.
	const existingSkills = (existingData[1]?.results as ProfileSkill[] | undefined ?? []).map(({ skill }) => skill);
	const filteredSkills = (skills ?? []).filter((skill) => !existingSkills.includes(skill));

	const results = await database.batch([
		database.prepare(`
			UPDATE ${DBTables.PROFILE}
			SET
				${Object.keys(fieldsToUpdate).map((key) => `${key} = ?`).join(', ')}
			WHERE
				id = ?
				AND activatedAt IS NOT NULL
				AND deletedAt IS NULL

		`).bind(...Object.values(fieldsToUpdate), id),
		...filteredLinks.map((url) => {
			const { id: linkId } = generateBaseDBfields();

			return database.prepare(`
				INSERT INTO ${DBTables.PROFILE_LINKS} (
					id, url, profile_id
				)
				SELECT
					?, ?, id
				FROM ${DBTables.PROFILE}
				WHERE
					id = ?
					AND activatedAt IS NOT NULL
					AND deletedAt IS NULL
				LIMIT 1
			`).bind(linkId, url, id);
		}),
		...filteredSkills.map((skill) => {
			const { id: skillId } = generateBaseDBfields();

			return database.prepare(`
				INSERT INTO ${DBTables.PROFILE_SKILLS} (
					id, skill, profile_id
				)
				SELECT
					?, ?, id
				FROM ${DBTables.PROFILE}
				WHERE
					id = ?
					AND activatedAt IS NOT NULL
					AND deletedAt IS NULL
				LIMIT 1
			`).bind(skillId, skill, id);
		})
	]);

	return results.every(({ success }) => success);
}

export async function getProfileById(database: D1Database, id: string) {
	const results = await database.batch([
		database.prepare(`
			SELECT *
			FROM ${DBTables.PROFILE}
			WHERE
				id = ?
				AND activatedAt IS NOT NULL
				AND deletedAt IS NULL
			LIMIT 1
		`).bind(id),
		database.prepare(`SELECT url FROM ${DBTables.PROFILE_LINKS} WHERE profile_id = ?`).bind(id),
		database.prepare(`SELECT skill FROM ${DBTables.PROFILE_SKILLS} WHERE profile_id = ?`).bind(id)
	]);

	const profile = results[0]?.results[0] as Profile | undefined;

	if (!profile) {
		return undefined;
	}

	profile.links = (results[1]?.results as ProfileLink[] | undefined ?? []).map(({ url }) => url);
	profile.skills = (results[2]?.results as ProfileSkill[] | undefined ?? []).map(({ skill }) => skill);

	return transformProfile(profile);
}

export async function getAllProfiles(database: D1Database) {
	const results = await database.batch([
		database.prepare(`
			SELECT *
			FROM ${DBTables.PROFILE}
			WHERE
				activatedAt IS NOT NULL
				AND deletedAt IS NULL
		`),
		// TODO: narrow down queries to only active profiles
		database.prepare(`SELECT profile_id, url FROM ${DBTables.PROFILE_LINKS}`),
		database.prepare(`SELECT profile_id, skill FROM ${DBTables.PROFILE_SKILLS}`)
	]);

	const profiles = new Map(
		(results[0]?.results as Profile[] | undefined ?? [])
			.map((profile) => [profile.id, transformProfile(profile)])
	);

	// Assign links to profiles
	(results[1]?.results as ProfileLink[] | undefined ?? []).forEach(({ profile_id, url }) => {
		const profile = profiles.get(profile_id);

		if (profile) {
			profile.links ??= [];
			profile.links.push(url);
		}
	});

	// Assign skills to profiles
	(results[2]?.results as ProfileSkill[] | undefined ?? []).forEach(({ profile_id, skill }) => {
		const profile = profiles.get(profile_id);

		if (profile) {
			profile.skills ??= [];
			profile.skills.push(skill);
		}
	});

	return [...profiles.values()];
}

export async function deleteProfileById(database: D1Database, id: string) {
	const now = new Date().toISOString();

	const { success } = await database
		.prepare(`
			UPDATE ${DBTables.PROFILE}
			SET deletedAt = ?
			WHERE id = ?
			LIMIT 1
		`)
		.bind(now, id)
		.run();

	return success;
}
