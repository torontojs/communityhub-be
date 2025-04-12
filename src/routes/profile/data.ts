import { DBTables, DEFAULT_TEAM_ID, generateBaseDBfields } from '../../constants/db.ts';
import type { CreateProfileData, Profile, UpdateProfileData } from './validation.ts';

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

		// TODO: save links and skills
		database.prepare(`
			INSERT INTO ${DBTables.ACCESS} (
				id, schemaVersion, access_level, password, email
			)
			VALUES (
				?, ?, ?, ?, ?
			)
		`).bind(id, schemaVersion, 'volunteer', password, email),

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

export async function updateProfileById(database: D1Database, id: string, data: UpdateProfileData) {
	// TODO: do separate update for links and skills
	const { success } = await database
		.prepare(`
			UPDATE ${DBTables.PROFILE}
			SET ${Object.keys(data).join(', ')}
			WHERE id = ?
		`)
		.bind(...Object.values(data), id)
		.run();

	return success;
}

export async function getProfileById(database: D1Database, id: string) {
	// TODO: join links and skills
	const profile = await database
		.prepare(`SELECT * FROM ${DBTables.PROFILE} WHERE id = ? LIMIT 1`)
		.bind(id)
		.first<Profile>();

	return profile;
}

export async function getAllProfiles(database: D1Database) {
	// TODO: join links and skills
	const { results } = await database.prepare(`SELECT * FROM ${DBTables.PROFILE}`).run<Profile>();

	return results;
}

export async function deleteProfileById(database: D1Database, id: string) {
	const now = new Date().toISOString();

	const { success } = await database
		.prepare(`
			UPDATE ${DBTables.PROFILE}
			SET deactivatedAt = ?
			WHERE id = ?
			LIMIT 1
		`)
		.bind(now, id)
		.run();

	return success;
}
