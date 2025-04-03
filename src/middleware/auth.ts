import type { Context, Next } from 'hono';
import {
	deleteSession,
	extendExistingSession,
	getSession,
	isSesionExpired,
	shouldSessionExtend
} from 'src/utils/auth.ts';
import { StatusCodes } from '../utils/responses.ts';

export const authMiddleware = async (context: Context, next: Next) => {
	const { session, sessionToken } = await getSession(context);

	const invalidSessionResponse = { message: 'Invalid session' };

	if (!session) {
		return context.json(invalidSessionResponse, StatusCodes.UNAUTHORIZED);
	}

	const isExpired = isSesionExpired(session.expiry);

	if (isExpired) {
		await deleteSession({ context, sessionToken });
		return context.json(invalidSessionResponse, StatusCodes.UNAUTHORIZED);
	}

	const shouldExtendTokenExpiry = shouldSessionExtend(session.expiry);

	if (shouldExtendTokenExpiry) {
		await extendExistingSession({
			sessionToken,
			session,
			context
		});
	}

	context.set('session', session);
	return next();
};
