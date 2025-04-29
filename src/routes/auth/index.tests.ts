import { describe, expect, test } from 'vitest';
import app from '../../index.ts';
import type { StatusResponse } from '../../utils/responses.ts';
// Import { MockEnvBindings } from '../../utils/testing.ts';

const MOCK_ENV = new MockEnvBindings();

describe('Sign-in route', () => {
	test('Success', async () => {
		const response = await app.request('/auth/sign-in', {
			method: 'POST',
			headers: new Headers({ 'Content-Type': 'application/json' }),
			body: JSON.stringify({
				email: 'test@example.com',
				password: 'password123'
			})
		}, MOCK_ENV);
		const json: StatusResponse = await response.json();

		expect(json.message).toBe('Authorized successfully');
	});
});
