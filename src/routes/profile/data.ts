import { DBTables, generateBaseDBfields } from '../../constants/db.ts';
import type { CreateProfileData, Profile, UpdateProfileData } from './validation.ts';

export async function insertProfile(database: D1Database, body: CreateProfileData) {
	const baseDbfields = generateBaseDBfields();

	const { success } = await database.prepare(`
		INSERT INTO ${DBTables.PROFILE} (
			${Object.keys(baseDbfields).join(', ')},
			${Object.keys(body).join(', ')}
		)
		VALUES (
			${[...Object.keys(baseDbfields)].fill('?').join(', ')},
			${[...Object.keys(body)].fill('?').join(', ')}
		)
	`)
		.bind(...Object.values(baseDbfields), ...Object.values(body))
		.run();

	return { success, id: baseDbfields.id };
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
		.prepare(`SELECT * FROM ${DBTables.PROFILE} WHERE id = ?`)
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

export async function validateExistingEmail(database: D1Database, email: string) {
	const { email: existingEmail } = await database
		.prepare(`SSELECT email FROM ${DBTables.PROFILE} WHERE email = ? LIMIT 1`)
		.bind(email)
		.first<{ email: string }>() ?? {};

	return Boolean(existingEmail);
}
