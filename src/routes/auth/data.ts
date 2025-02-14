import type { SignInData } from './validate.ts';

export async function authenticate(database: D1Database, body: SignInData): Promise<string> {
	const { results } = await database
		.prepare('SELECT password FROM profile WHERE email = ?')
		.bind(body.email)
		.run();

	const password = results[0]?.['password'] as string | undefined;

	if (!password) {
		throw new Error('Password not found');
	}

	return password;
}

export async function validateEmail(database: D1Database, email: string) {
	const { results } = await database
		.prepare('SELECT email FROM profile WHERE email = ?')
		.bind(email)
		.run();

	return Boolean(results.length);
}

export async function activateProfile(database: D1Database, email: string) {
	const now = new Date().toISOString();
	const { success } = await database
		.prepare('UPDATE profile SET activatedAt = ? WHERE email = ?')
		.bind(now, email)
		.run();

	return success;
}
