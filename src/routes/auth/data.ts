import { type AccessSchema, DBTables } from '../../constants/db.ts';
import type { Profile } from './validate.ts';

export async function getPassword(database: D1Database, email: string) {
	const { results } = await database
		.prepare(`
            SELECT password
            FROM ${DBTables.ACCESS}
            WHERE email = ?
			LIMIT 1
        `)
		.bind(email)
		.run<AccessSchema>();

	return results[0]?.password;
}

export async function getProfileId(database: D1Database, email: string) {
	const { results } = await database
		.prepare(`SELECT id FROM ${DBTables.PROFILE} WHERE email = ? AND activatedAt IS NOT NULL LIMIT 1`)
		.bind(email)
		.run<Profile>();

	return results[0]?.id;
}

export async function getAccessLevel(database: D1Database, profileId: string) {
	const { results } = await database
		.prepare(`SELECT access_level FROM ${DBTables.ACCESS} WHERE id = ? LIMIT 1`)
		.bind(profileId)
		.run<AccessSchema>();

	return results[0]?.access_level;
}

export async function checkEmail(database: D1Database, email: string) {
	const { results } = await database
		.prepare(`SELECT email FROM ${DBTables.PROFILE} WHERE email = ? LIMIT 1`)
		.bind(email)
		.run();

	return Boolean(results.length);
}

export async function activateProfile(database: D1Database, email: string) {
	const now = new Date().toISOString();
	const { success } = await database
		.prepare(`UPDATE ${DBTables.PROFILE} SET activatedAt = ? WHERE email = ?`)
		.bind(now, email)
		.run();

	return success;
}
