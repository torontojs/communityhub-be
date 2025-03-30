import type { Access } from 'src/types/data/access.ts';
import { DBTables } from '../../constants/db.ts';

export async function getLoginInfo(database: D1Database, email: string) {
	const results = await database
		.prepare(`
       SELECT
           a.password as storedPassword,
           a.access_level as accessLevel,
           p.id as profileId
       FROM access a
       INNER JOIN
       profile p
       on p.id = a.id
       WHERE p.email = ? and p.activatedAt IS NOT NULL and p.deactivatedAt IS NULL
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
