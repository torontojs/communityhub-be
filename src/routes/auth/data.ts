import { DBTables } from '../../constants/db.ts';
import type { SignInData } from './validate.ts';

export async function getPassword(database: D1Database, body: SignInData): Promise<string> {
	const { results } = await database
		.prepare(`SELECT password FROM ${DBTables.PROFILE} WHERE email = ? AND activatedAt IS NOT NULL`)
		.bind(body.email)
		.run();

	const password = results[0]?.['password'] as string | undefined;

	if (!password) {
		throw new Error('No active account found with the provided email');
	}

	return password;
}

export async function checkEmail(database: D1Database, email: string) {
	const { results } = await database
		.prepare(`SELECT email FROM ${DBTables.PROFILE} WHERE email = ?`)
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
