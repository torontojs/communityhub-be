import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import app from '../../index.ts';

describe('Sign-up route', () => {
	it('Success', async () => {
		const response = await app.request('/auth/sign-in', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'test@example.com',
				password: 'Password123!@#'
			})
		}, env);

		expect(response.status).toBe(200);
	});
});
