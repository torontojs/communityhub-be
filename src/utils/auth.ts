import { addDays, differenceInDays } from 'date-fns';
import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import type { SessionData } from 'src/types/data/session';
import { setCookie } from './cookie';

export const SESION_LIFESPAN_IN_DAYS = 90;
const SESSION_COOKIE_NAME = 'auth_token';

function isSesionExpired(sessionExpiryISO: string) {
	return new Date() > new Date(sessionExpiryISO);
}

function shouldSessionExtend(sessionExpiryISO: string) {
	const isExpired = isSesionExpired(sessionExpiryISO);

	if (isExpired) {
		throw new Error('Invalid session');
	}

	const TWO = 2;
	const HALF_SESSION_LIFESPAN_IN_DAYS = Math.floor(SESION_LIFESPAN_IN_DAYS / TWO);

	const daysUntilTokenExpiry = differenceInDays(new Date(sessionExpiryISO), new Date());

	return daysUntilTokenExpiry < HALF_SESSION_LIFESPAN_IN_DAYS;
}

interface DeleteSessionInput {
	context: Context<EnvironmentBindings>;
	sessionToken: string;
}

async function deleteSession({ context, sessionToken }: DeleteSessionInput) {
	// Delete session on server
	await context.env.SESSION_TOKENS.delete(sessionToken);

	// Delete session on client
	setCookie({
		context,
		name: SESSION_COOKIE_NAME,
		value: 'deleted',
		expires: new Date(0)
	});
}

async function getSession(context: Context<EnvironmentBindings>) {
	const sessionToken = getCookie(context, SESSION_COOKIE_NAME);
	if (!sessionToken) {
		return {
			session: null,
			sessionToken: null
		};
	}

	const sessionData = await context.env.SESSION_TOKENS.get<SessionData>(sessionToken, 'json');
	if (!sessionData) {
		return {
			session: null,
			sessionToken: null
		};
	}

	return {
		session: sessionData,
		sessionToken
	};
}

interface CreateSessionInput {
	session: Omit<SessionData, 'expiry'>;
	context: Context<EnvironmentBindings>;
}

async function createSession({
	session,
	context
}: CreateSessionInput) {
	const sessionToken = crypto.randomUUID();
	const tokenExpiryISO = addDays(new Date(), SESION_LIFESPAN_IN_DAYS).toISOString();
	const sessionDataObject: SessionData = {
		id: session.id,
		email: session.email,
		access: session.access,
		expiry: tokenExpiryISO
	};
	const sessionData = JSON.stringify(sessionDataObject);

	// Create session on server
	await context.env.SESSION_TOKENS.put(sessionToken, sessionData);

	// Send session to client
	setCookie({
		context,
		name: SESSION_COOKIE_NAME,
		value: sessionToken,
		expires: new Date(tokenExpiryISO)
	});

	return sessionToken;
}

interface ExtendSessionInput {
	sessionToken: string;
	session: SessionData;
	context: Context<EnvironmentBindings>;
}

async function extendExistingSession({
	sessionToken,
	session,
	context
}: ExtendSessionInput) {
	const tokenExpiry = addDays(new Date(), SESION_LIFESPAN_IN_DAYS).toISOString();
	const updatedSessionData = JSON.stringify(
		{
			...session,
			expiry: tokenExpiry
		} satisfies SessionData
	);
	await context.env.SESSION_TOKENS.put(sessionToken, updatedSessionData);
}

export {
	createSession,
	deleteSession,
	extendExistingSession,
	getSession,
	isSesionExpired,
	shouldSessionExtend
};
