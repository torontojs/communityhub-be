import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import app from '../../index.ts';

describe('Sign-in route', () => {
	it('Success', async () => {
		// 	Await env.Database.exec(`
		//   INSERT INTO users (email, password_hash)
		//   VALUES ('test@example.com', 'hashed_password123')
		// `);

		const response = await app.request('/auth/sign-in', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'test@example.com',
				password: 'password123'
			})
		}, env);

		expect(response.status).toBe(200);
	});
});
// Import { describe, expect, test } from 'vitest';
// Import app from '../../index.ts';
// Import type { StatusResponse } from '../../utils/responses.ts';
// Import { MockEnvBindings } from '../../utils/testing.ts';

// Const MOCK_ENV = new MockEnvBindings();

// Describe('Sign-in route', () => {
// 	Test('Success', async () => {
// 		Const response = await app.request('/auth/sign-in', {
// 			Method: 'POST',
// 			Headers: new Headers({ 'Content-Type': 'application/json' }),
// 			Body: JSON.stringify({
// 				Email: 'test@example.com',
// 				Password: 'password123'
// 			})
// 		}, MOCK_ENV);
// 		Const json: StatusResponse = await response.json();

// 		Expect(json.message).toBe('Authorized successfully');
// 	});
// });
