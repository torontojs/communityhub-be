import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { CookieOptions } from 'hono/utils/cookie';

const SESSION_LIFESPAN_IN_HOURS = 24;
const SESSION_COOKIE_NAME = 'auth_token';
const DELETED_COOKIE_VALUE = 'DELETED';
const DEFAULT_COOKIE_OPTIONS = {
	httpOnly: true,
	path: '/',
	secure: true,
	sameSite: 'Strict'
} satisfies CookieOptions;

export const Access = {
	ADMIN: 'admin',
	ORGANIZER: 'organizer',
	VOLUNTEER: 'volunteer'
} as const;

export type AccessLevel = typeof Access[keyof typeof Access];

export interface SessionData {
	id: string;
	email: string;
	access: AccessLevel;
	expiry: ISODate;
	token: string;
}

function isSesionExpired(sessionExpiryISO: string) {
	return new Date() > new Date(sessionExpiryISO);
}

interface DeleteSessionParams {
	context: Context<EnvironmentBindings>;
	sessionToken: string;
}

export async function deleteSession({ context, sessionToken }: DeleteSessionParams) {
	// Delete session on server
	await context.env.SessionTokens.delete(sessionToken);

	// Delete session on client
	setCookie(
		context,
		SESSION_COOKIE_NAME,
		DELETED_COOKIE_VALUE,
		{
			...DEFAULT_COOKIE_OPTIONS,
			expires: new Date(0)
		}
	);
}

export function getSession(context: Context<EnvironmentBindings>) {
	return context.get('session');
}

interface ExtendSessionParams {
	sessionToken: string;
	session: SessionData;
	context: Context<EnvironmentBindings>;
}

async function extendExistingSession({
	sessionToken,
	session,
	context
}: ExtendSessionParams) {
	const tokenExpiry = new Date();
	tokenExpiry.setHours(tokenExpiry.getHours() + SESSION_LIFESPAN_IN_HOURS);

	const updatedSession: SessionData = {
		...session,
		expiry: tokenExpiry.toISOString()
	};

	// Update session on server
	await context.env.SessionTokens.put(
		sessionToken,
		JSON.stringify(updatedSession)
	);

	// Update session on client
	setCookie(
		context,
		SESSION_COOKIE_NAME,
		sessionToken,
		{
			...DEFAULT_COOKIE_OPTIONS,
			expires: tokenExpiry
		}
	);

	return updatedSession;
}

export async function revalidateSession(context: Context<EnvironmentBindings>) {
	const sessionToken = getCookie(context, SESSION_COOKIE_NAME);
	if (!sessionToken) {
		return undefined;
	}

	const session = await context.env.SessionTokens.get<SessionData>(sessionToken, 'json');
	if (!session) {
		// User has a session token but it's invalid so delete it
		await deleteSession({ context, sessionToken });
		return;
	}

	if (isSesionExpired(session.expiry)) {
		await deleteSession({ context, sessionToken });
		return;
	}

	const extendedSession = await extendExistingSession({
		sessionToken,
		session,
		context
	});

	return extendedSession;
}

interface CreateSessionParams {
	id: string;
	email: string;
	access: AccessLevel;
	context: Context<EnvironmentBindings>;
}

export async function createSession({
	email,
	id,
	access,
	context
}: CreateSessionParams) {
	const sessionToken = crypto.randomUUID();
	const tokenExpiry = new Date();
	tokenExpiry.setHours(tokenExpiry.getHours() + SESSION_LIFESPAN_IN_HOURS);

	// Create session on server
	await context.env.SessionTokens.put(
		sessionToken,
		JSON.stringify(
			{
				id,
				email,
				access,
				expiry: tokenExpiry.toISOString(),
				token: sessionToken
			} satisfies SessionData
		)
	);

	// Send session to client
	setCookie(
		context,
		SESSION_COOKIE_NAME,
		sessionToken,
		{
			...DEFAULT_COOKIE_OPTIONS,
			expires: tokenExpiry
		}
	);

	return sessionToken;
}
