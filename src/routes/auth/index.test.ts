import { describe, expect, test } from 'vitest';
import app from '../../index.ts';
import type { StatusResponse } from '../../utils/responses.ts';
import { MockEnvBindings } from '../../utils/testing.ts';

const MOCK_ENV = new MockEnvBindings();

describe('Sign-in route', () => {
	test('Incorrect username/password should show unsuccessful login message', async () => {
		const response = await app.request('/auth/sign-in', {
			method: 'POST',
			headers: new Headers({ 'Content-Type': 'application/json' }),
			body: JSON.stringify({
				email: 'nope@example.com',
				password: 'thisDoesNotWork'
			})
		}, MOCK_ENV);
		const json: StatusResponse = await response.json();

		expect(json.message).toBe('Either your email/password combination is invalid, or your account is not active');
	});
});
