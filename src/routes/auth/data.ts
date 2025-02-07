import type { SignInData } from './validate.ts';

export async function authenticate(database: D1Database, body: SignInData): Promise<string> {
	const { results } = await database
		.prepare('SELECT password FROM profile WHERE email = ?')
		.bind(body.email)
		.run();

	const password = results[0];

	if (typeof password !== 'string') {
		throw new Error('Password not found or is not a string');
	}

	return password;
}
