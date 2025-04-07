import type { Context } from 'hono';
import { setCookie } from 'hono/cookie';
import type { CookieOptions } from 'hono/utils/cookie.js';

const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
	path: '/',
	secure: true,
	httpOnly: true,
	sameSite: 'Strict'
};

export function presetSetCookie(
	context: Context<EnvironmentBindings>,
	name: string,
	value: string,
	expires: Date
): void {
	setCookie(context, name, value, {
		...DEFAULT_COOKIE_OPTIONS,
		expires
	});
}
