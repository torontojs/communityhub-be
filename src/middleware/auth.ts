import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import type { SessionData } from '../types/data/session.d.ts';
import { StatusCodes, type StatusResponse } from '../utils/responses.ts';

export const authMiddleware = async (context: Context, next: Next) => {
	// Get token from cookie
	const sessionToken: string | undefined = getCookie(context, 'auth_token');
	const genericUnauthorizedResponse = { message: 'Invalid or missing token' };

	if (!sessionToken) {
		return context.json<StatusResponse>(genericUnauthorizedResponse, StatusCodes.UNAUTHORIZED);
	}
	const sessionData: SessionData | undefined = await context.env.SESSION_TOKENS.get(sessionToken, 'json');

	if (!sessionData) {
		return context.json<StatusResponse>(genericUnauthorizedResponse, StatusCodes.UNAUTHORIZED);
	}

	if (new Date(sessionData.expiry) < new Date()) {
		await context.env.SESSION_TOKENS.delete(sessionToken);
		return context.json<StatusResponse>(genericUnauthorizedResponse, StatusCodes.UNAUTHORIZED);
	}

	context.set('session', sessionData);
	return next();
};
