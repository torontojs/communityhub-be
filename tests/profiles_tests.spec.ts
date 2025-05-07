import { expect, test } from '@playwright/test';

test('API GET Request', async ({ request }) => {
	const response = await request.get('http://localhost:4242/profiles');

	expect(response.status()).toBe(200);

	const text = await response.text();
	console.log(response);
	expect(text).toContain('John Doe');
});
