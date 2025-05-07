import { expect, test } from '@playwright/test';
import { request } from 'http';
import { text } from 'stream/consumers';

let response;

test.beforeEach(async ({ request }) => {
	response = await request.get('http://localhost:4242/teams');
	expect(response.status()).toBe(200);
});

test('API GET Request', async ({ request }) => {
	// const response = await request.get('http://localhost:4242/teams');

	// expect(response.status()).toBe(200);

	const text = await response.text();
	const json_response = await response.json();
	console.log(await response.json());
	// expect(json_response).toContain('Team A');
});

test('API GET Request USING UUID number', async ({ request }) => {
	const json_response = await response.json();

	/*for (let key in json_response) {
        console.log(key);
    } */

	console.log(json_response['data'][0]['id']);

	let uuid_number = json_response['data'][0]['id'];

	const response2 = await request.get('http://localhost:4242/teams/' + `${uuid_number}`);

	expect(response2.status()).toBe(200);

	// expect(json_response).toContain('Team A');
});

test('API POST Request', async ({ request }) => {
	// const response = await request.get('http://localhost:4242/teams');

	// expect(response.status()).toBe(200);

	const text = await response.text();
	const json_response = await response.json();
	console.log(await response.json());
	// expect(json_response).toContain('Team A');
});
