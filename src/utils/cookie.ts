import type { Context } from 'hono';
import { setCookie as setHonoCookie } from 'hono/cookie';
import type { CookieOptions } from 'hono/utils/cookie';

const DEFAULT_COOKIE_OPTIONS = {
	httpOnly: true,
	path: '/',
	secure: true,
	sameSite: 'Strict'
} satisfies CookieOptions;

interface SetCookieInput {
	context: Context<EnvironmentBindings>;
	name: string;
	value: string;
	expires: Date;
}

function setCookie({
	context,
	name,
	value,
	expires
}: SetCookieInput) {
	const optionsToSet = { ...DEFAULT_COOKIE_OPTIONS, expires } satisfies CookieOptions;

	setHonoCookie(context, name, value, optionsToSet);
}

export {
	setCookie
};
