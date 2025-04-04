import type { Context, Next } from 'hono';
import {
	getSession
} from 'src/utils/auth.ts';
import { StatusCodes } from '../utils/responses.ts';

export const authMiddleware = async (context: Context, next: Next) => {
	const { session } = await getSession(context);

	const invalidSessionResponse = { message: 'Invalid session' };

	if (!session) {
		return context.json(invalidSessionResponse, StatusCodes.UNAUTHORIZED);
	}

	context.set('session', session);
	return next();
};
