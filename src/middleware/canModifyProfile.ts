import type { Context, Next } from 'hono';
import { Access, getSession } from '../utils/auth.ts';
import { StatusCodes } from '../utils/responses.ts';

export const canModifyProfile = async (context: Context<EnvironmentBindings>, next: Next) => {
	const session = getSession(context);
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
