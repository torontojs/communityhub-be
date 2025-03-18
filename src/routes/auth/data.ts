import { type AccessSchema, DBTables } from '../../constants/db.ts';
import type { Profile } from './validate.ts';

export async function getAccess(database: D1Database, email: string) {
	const { results } = await database
		.prepare(`
            SELECT id, password, access_level
            FROM ${DBTables.ACCESS}
            WHERE email = ?
			LIMIT 1
        `)
		.bind(email)
		.run<AccessSchema>();

	return results[0];
}

export async function checkProfile(database: D1Database, profileId: string) {
	const { results } = await database
		.prepare(`
			SELECT id
			FROM ${DBTables.PROFILE}
			WHERE id = ?
			AND activatedAt IS NOT NULL
			AND deactivatedAt IS NULL
			LIMIT 1
		`)
		.bind(profileId)
		.run<Profile>();

	return Boolean(results.length);
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
