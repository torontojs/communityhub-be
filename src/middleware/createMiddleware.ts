import type { Context, Next } from 'hono';
import type { Session } from '../types/data/session.d.ts';
import { AuthorizationRole } from '../types/data/role';
import { StatusCodes } from '../utils/responses.ts';

const AccessHierachy = {
	admin: ['admin'],
	organizer: ['admin', 'organizer'],
	volunteer: ['admin', 'organizer', 'volunteer']
};

export const createAccessMiddlware = (minimumAcess: 'admin' | 'organizer' | 'volunteer') => async (context: Context, next: Next) => {
	const session = context.get('session') as Session | undefined;

	if (!session) {
		return context.json({ message: 'Unauthorized' }, StatusCodes.UNAUTHORIZED);
	}

	if (!AccessHierachy[minimumAcess].includes(session.role)) {
		return context.json({ message: 'Forbidden' }, StatusCodes.FORBIDDEN);
	}
	return next();
};

export const authorizationAdmin = createAccessMiddlware('admin');
export const authorizationOrganizer = createAccessMiddlware('organizer');
export const authorizationVolunteer = createAccessMiddlware('volunteer');

export const canModifyOwnProfile = async (context: Context, next: Next) => {
	const session = context.get('session') as Session;
	const targetId = context.req.param('id');

	// If admin or organizer, allow
	if (session.role === AuthorizationRole.ADMIN || session.role === AuthorizationRole.ORGANIZER) {
		return next();
	}

	// For volunteers, only allow if it's their own profile
	if (session.id !== targetId) {
		return context.json({ message: 'Can only modify own profile' }, StatusCodes.FORBIDDEN);
	}

	return next();
};
