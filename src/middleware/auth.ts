import { type Context, type Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { StatusCodes } from '../utils/responses.ts';

export const authMiddleware = async (context: Context, next: Next) => {
	try {
		// Get token from cookie
		const sessionToken = getCookie(context, 'auth_token');

		if (!sessionToken) {
			return context.json({ message: 'Invalid or missing token' }, StatusCodes.UNAUTHORIZED);
		}
		const sessionData = await context.env.SESSION_TOKENS.get(sessionToken, 'json');

		if (!sessionData) {
			return context.json({ message: 'Invalid session' }, StatusCodes.UNAUTHORIZED);
		}

		if (new Date(sessionData.expiry) > new Date()) {
			await context.env.SESSION_TOKENS.delete(sessionToken);
			return context.json({ message: 'Session expired' }, StatusCodes.UNAUTHORIZED);
		}

		await next();
	} catch (error) {
		return context.json({ message: 'Invalid token' }, StatusCodes.INTERNAL_SERVER_ERROR);
	}
};
