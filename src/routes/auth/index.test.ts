import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import app from '../../index.ts';

describe('Sign-in route', () => {
	it('Success', async () => {
		await env.Database.exec(`
      INSERT INTO users (email, password_hash)
      VALUES ('test@example.com', 'hashed_password123')
    `);

		const response = await app.request('/auth/sign-in', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'test@example.com',
				password: 'password123'
			})
		}, env);

		// Verify
		expect(response.status).toBe(200);
	});
});
