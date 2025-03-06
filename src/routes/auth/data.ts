import { DBTables } from '../../constants/db.ts';
import type { Profile, SignInData } from './validate.ts';

export async function getPassword(database: D1Database, body: SignInData): Promise<string> {
	const { results } = await database
		.prepare(`
            SELECT password
            FROM ${DBTables.ACCESS}
            WHERE id IN (
                SELECT id
                FROM ${DBTables.PROFILE}
                WHERE email = ? AND activatedAt IS NOT NULL
            )
        `)
		.bind(body.email)
		.run<Profile>();

	const password = results[0]?.password;

	if (!password) {
		throw new Error('No active account found with the provided email');
	}

	return password;
}

export async function getProfileId(database: D1Database, body: SignInData): Promise<string> {
	const { results } = await database
		.prepare(`SELECT id FROM ${DBTables.PROFILE} WHERE email = ? AND activatedAt IS NOT NULL LIMIT 1`)
		.bind(body.email)
		.run<Profile>();

	const id = results[0]?.id;

	if (!id) {
		throw new Error('No active account found with the provided email');
	}

	return id;
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
