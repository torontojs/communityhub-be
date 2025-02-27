import type { Context, Next } from 'hono';
// import type { AuthMiddleware } from '../types/data/authMiddleware.d.ts';
// import type { Role } from '../types/data/role.d.ts';
import { getCookie } from 'hono/cookie';
import type { Session } from '../types/data/session.d.ts';
import { StatusCodes } from '../utils/responses.ts';

export const authMiddleware = async (context: Context, next: Next) => {
	try {
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
		return next();
	} catch (error) {
		return context.json({ message: 'Invalid token' }, StatusCodes.INTERNAL_SERVER_ERROR);
	}
};

// export const createRoleMiddleware = ( requiredRole: Role): AuthMiddleware => {
// 	return async (context , next) => {
// 		const session = context.get('session') as Session | undefined;
// 		if (!session) {
// 			return context.json({ message: 'Unauthorized' }, StatusCodes.UNAUTHORIZED);
// 		}
// 		if (session.role !== requiredRole) {
// 			return context.json({ message: 'Forbidden' }, StatusCodes.FORBIDDEN);
// 		}
// 		return next();
// 	}
// }
