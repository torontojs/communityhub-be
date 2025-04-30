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
