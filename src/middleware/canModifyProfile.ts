import type { Context, Next } from 'hono';
import { Access } from '../types/data/access.ts';
import type { SessionData } from '../types/data/session.d.ts';
import { StatusCodes } from '../utils/responses.ts';

export const canModifyProfile = async (context: Context, next: Next) => {
	const session = context.get('session') as SessionData;
	const targetId = context.req.param('id');

	// If admin, allow
	if (session.access === Access.ADMIN) {
		return next();
	}

	// For volunteers, only allow if it's their own profile
	if (session.id !== targetId) {
		return context.json({ message: 'Can only modify own profile' }, StatusCodes.FORBIDDEN);
	}

	return next();
};
