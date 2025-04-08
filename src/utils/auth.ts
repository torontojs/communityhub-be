import { addHours, differenceInHours } from 'date-fns';
import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import type { SessionData } from 'src/types/data/session';
import { setCookie } from './cookie';

const SESION_LIFESPAN_IN_HOURS = 24;
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
	const HALF_SESSION_LIFESPAN_IN_HOURS = Math.floor(SESION_LIFESPAN_IN_HOURS / TWO);

	const daysUntilTokenExpiry = differenceInHours(new Date(sessionExpiryISO), new Date());

	return daysUntilTokenExpiry < HALF_SESSION_LIFESPAN_IN_HOURS;
}

interface ExtendSessionInput {
	sessionToken: string;
	session: SessionData;
	sessionKV: Context<EnvironmentBindings>['env']['SESSION_TOKENS'];
}

async function extendExistingSession({
	sessionToken,
	session,
	sessionKV
}: ExtendSessionInput) {
	const tokenExpiry = addHours(new Date(), SESION_LIFESPAN_IN_HOURS).toISOString();
	const updatedSessionData = JSON.stringify(
		{
			...session,
			expiry: tokenExpiry
		} satisfies SessionData
	);
	await sessionKV.put(sessionToken, updatedSessionData);

	const updatedSession = await sessionKV.get<SessionData>(sessionToken, 'json');
	return updatedSession;
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
	if (!sessionToken || sessionToken === 'deleted') {
		return null;
	}

	const session = await context.env.SESSION_TOKENS.get<SessionData>(sessionToken, 'json');
	if (!session) {
		// User has a session token but it's invalid so delete it
		await deleteSession({ context, sessionToken });
		return null;
	}

	if (isSesionExpired(session.expiry)) {
		await deleteSession({ context, sessionToken });
		return null;
	}

	if (shouldSessionExtend(session.expiry)) {
		const extendedSession = await extendExistingSession({
			sessionKV: context.env.SESSION_TOKENS,
			sessionToken,
			session
		});

		return extendedSession;
	}

	return session;
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
	const tokenExpiryISO = addHours(new Date(), SESION_LIFESPAN_IN_HOURS).toISOString();
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

export {
	createSession,
	getSession
};
