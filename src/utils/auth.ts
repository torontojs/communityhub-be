import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { setCookie } from './cookie';

const SESSION_LIFESPAN_IN_HOURS = 24;
const MILISECONDS_IN_SECOND = 1000;
const SESSION_COOKIE_NAME = 'auth_token';
const DELETED_COOKIE_VALUE = 'DELETED';

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
	token: string;
}

function getSessionExpirySecondsEpoch() {
	const tokenExpiry = new Date();
	tokenExpiry.setHours(tokenExpiry.getHours() + SESSION_LIFESPAN_IN_HOURS);

	const tokenExpirySecondsEpoch = Math.floor(tokenExpiry.valueOf() / MILISECONDS_IN_SECOND);

	return tokenExpirySecondsEpoch;
}

interface DeleteSessionParams {
	context: Context<EnvironmentBindings>;
	sessionToken: string;
}

export async function deleteSession({ context, sessionToken }: DeleteSessionParams) {
	// Delete session on server
	await context.env.SESSION_TOKENS.delete(sessionToken);

	// Delete session on client
	setCookie({
		context,
		name: SESSION_COOKIE_NAME,
		value: DELETED_COOKIE_VALUE,
		expires: new Date(0)
	});
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
	const expirySecondsSinceEpoch = getSessionExpirySecondsEpoch();
	// Update session on server
	await context.env.SESSION_TOKENS.put(
		sessionToken,
		JSON.stringify(session),
		{
			expiration: expirySecondsSinceEpoch,
			metadata: {
				expiration: expirySecondsSinceEpoch
			}
		}
	);

	// Update session on client
	setCookie({
		context,
		name: SESSION_COOKIE_NAME,
		value: sessionToken,
		expires: new Date(expirySecondsSinceEpoch * MILISECONDS_IN_SECOND)
	});

	return session;
}

export async function revalidateSession(context: Context<EnvironmentBindings>) {
	const sessionToken = getCookie(context, SESSION_COOKIE_NAME);
	if (!sessionToken) {
		return undefined;
	}

	const session = await context.env.SESSION_TOKENS.get<SessionData>(sessionToken, 'json');
	if (!session) {
		// User has a session token but it's invalid so delete it
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

	const expirySecondsSinceEpoch = getSessionExpirySecondsEpoch();
	// Create session on server
	await context.env.SESSION_TOKENS.put(
		sessionToken,
		JSON.stringify(
			{
				id,
				email,
				access,
				token: sessionToken
			} satisfies SessionData
		),
		{
			expiration: expirySecondsSinceEpoch,
			metadata: {
				expiration: expirySecondsSinceEpoch
			}
		}
	);

	// Send session to client
	setCookie({
		context,
		name: SESSION_COOKIE_NAME,
		value: sessionToken,
		expires: new Date(expirySecondsSinceEpoch * MILISECONDS_IN_SECOND)
	});

	return sessionToken;
}
