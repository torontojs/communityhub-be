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
	options?: CookieOptions;
}

function setCookie({
	context,
	name,
	value,
	expires,
	options = DEFAULT_COOKIE_OPTIONS
}: SetCookieInput) {
	const optionsToSet = options
		? { ...options, ...DEFAULT_COOKIE_OPTIONS, expires }
		: { ...DEFAULT_COOKIE_OPTIONS, expires } satisfies CookieOptions;

	setHonoCookie(context, name, value, optionsToSet);
}

export {
	setCookie
};
