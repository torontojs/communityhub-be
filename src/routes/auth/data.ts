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
