import { addDays, differenceInDays } from 'date-fns';
import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import type { SessionData } from '../types/data/session.d.ts';
import { StatusCodes } from '../utils/responses.ts';

export const SESION_LIFESPAN_IN_DAYS = 90;
const TWO = 2;
const HALF_SESSION_LIFESPAN_IN_DAYS = Math.floor(SESION_LIFESPAN_IN_DAYS / TWO);

export const authMiddleware = async (context: Context, next: Next) => {
	// Get token from cookie
	const sessionToken: string | undefined = getCookie(context, 'auth_token');

	if (!sessionToken) {
		return context.json({ message: 'Invalid or missing token' }, StatusCodes.UNAUTHORIZED);
	}
	const sessionData: SessionData | undefined = await context.env.SESSION_TOKENS.get(sessionToken, 'json');

	if (!sessionData) {
		return context.json({ message: 'Invalid session' }, StatusCodes.UNAUTHORIZED);
	}

	// Expired session
	if (new Date(sessionData.expiry) < new Date()) {
		await context.env.SESSION_TOKENS.delete(sessionToken);
		return context.json({ message: 'Session expired' }, StatusCodes.UNAUTHORIZED);
	}

	// Extend session lifespan
	const daysUntilTokenExpiry = differenceInDays(new Date(sessionData.expiry), new Date());
	const shouldSessionExtend = daysUntilTokenExpiry < HALF_SESSION_LIFESPAN_IN_DAYS;
	if (shouldSessionExtend) {
		const tokenExpiry = addDays(new Date(), SESION_LIFESPAN_IN_DAYS).toISOString();
		await context.env.SESSION_TOKENS.put(sessionToken, {
			...sessionData,
			expiry: tokenExpiry
		});
	}

	context.set('session', sessionData);
	return next();
};
