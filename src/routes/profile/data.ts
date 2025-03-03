import { DBTables, generateBaseDBfields } from '../../constants/db.ts';
import type { CreateProfileData, Profile, UpdateProfileData } from './validation.ts';

export async function insertProfile(database: D1Database, { email, name, password, description }: CreateProfileData) {
	const { id, schemaVersion, happenedAt, insertedAt } = generateBaseDBfields();

	const results = await database.batch([
		database.prepare(`
			INSERT INTO ${DBTables.PROFILE} (
				id, schemaVersion, happenedAt, insertedAt,
				email, name
				${description ? ', descrition' : ''}
			)
			VALUES (
				?, ?, ?, ?,
				?, ?
				${description ? ', ?' : ''}
			)
		`).bind(
			id,
			schemaVersion,
			happenedAt,
			insertedAt,
			email,
			name,
			description
		),
		// TODO: insert into links table
		database.prepare(`
			INSERT INTO ${DBTables.PASSWORD} (
				id, schemaVersion, password
			)
			VALUES (
				?, ?, ?
			)
		`).bind(id, schemaVersion, password),
		database.prepare(`
			INSERT INTO ${DBTables.ACCESS} (
				id, access
			)
			VALUES (
				?, ?
			)
		`).bind(id, 'volunteer')
	]);

	return { success: results.every(({ success }) => success), id };
}

export async function updateProfileById(database: D1Database, id: string, data: UpdateProfileData) {
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
	const { results } = await database
		.prepare(`SELECT * FROM ${DBTables.PROFILE} WHERE id = ? LIMIT 1`)
		.bind(id)
		.run<Profile>();

	return results?.[0];
}

export async function getAllProfiles(database: D1Database) {
	const { results } = await database.prepare(`SELECT * FROM ${DBTables.PROFILE}`).run<Profile>();

	return results;
}

export async function deleteProfileById(database: D1Database, id: string) {
	const { success } = await database
		.prepare(`DELETE FROM ${DBTables.PROFILE} WHERE id = ?`)
		.bind(id)
		.run();

	return success;
}

interface UpdateProfileParams {
	id: string;
	data: Partial<{
		name: string,
		description: string,
		links: string,
		happenedAt: string
	}>;
	database: D1Database;
}

export async function updateProfile({
	id,
	data,
	database
}: UpdateProfileParams) {
	const entries = Object.entries(data).filter(
		([, value]) => value !== undefined
	);
	const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
	const query = `UPDATE ${DBTables.PROFILE} SET ${setClause} WHERE id = ?`;

	return database
		.prepare(query)
		.bind(...entries.map(([, value]) => value), id)
		.run();
}

export async function validateExistingEmail(database: D1Database, email: string) {
	const { email: existingEmail } = await database
		.prepare(`SSELECT email FROM ${DBTables.PROFILE} WHERE email = ? LIMIT 1`)
		.bind(email)
		.first<{ email: string }>() ?? {};

	return Boolean(existingEmail);
}
