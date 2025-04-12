import type { Access } from 'src/types/data/access.ts';
import { DBTables } from '../../constants/db.ts';

export async function getLoginInfo(database: D1Database, email: string) {
	const results = await database
		.prepare(`
       SELECT
           access.password as storedPassword,
           access.access_level as accessLevel,
           profile.id as profileId
       FROM access
       INNER JOIN
       profile
       ON profile.id = access.id
       WHERE profile.email = ? AND profile.activatedAt IS NOT NULL AND profile.deactivatedAt IS NULL
       LIMIT 1
    `)
		.bind(email)
		.first<{ storedPassword: string, accessLevel: Access, profileId: string }>();

	return results;
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
