import type { Context, Next } from 'hono';
// Import type { AuthMiddleware } from '../types/data/authMiddleware.d.ts';
// Import type { Role } from '../types/data/role.d.ts';
import { getCookie } from 'hono/cookie';
import type { Session } from '../types/data/session.d.ts';
import { StatusCodes } from '../utils/responses.ts';
import { createAccessMiddlware } from './createMiddleware';

export const authMiddleware = async (context: Context, next: Next) => {
		// Get token from cookie
		const sessionToken: string | undefined = getCookie(context, 'auth_token');

		if (!sessionToken) {
			return context.json({ message: 'Invalid or missing token' }, StatusCodes.UNAUTHORIZED);
		}
		const sessionData: Session | undefined = await context.env.SESSION_TOKENS.get(sessionToken, 'json');

		if (!sessionData) {
			return context.json({ message: 'Invalid session' }, StatusCodes.UNAUTHORIZED);
		}

		if (new Date(sessionData.expiry) > new Date()) {
			await context.env.SESSION_TOKENS.delete(sessionToken);
			return context.json({ message: 'Session expired' }, StatusCodes.UNAUTHORIZED);
		}

		context.set('session', sessionData);

		// Create and apply access middleware based on user's access level
		const accessMiddleware = createAccessMiddlware(sessionData.role);
		return accessMiddleware(context, next);
};
