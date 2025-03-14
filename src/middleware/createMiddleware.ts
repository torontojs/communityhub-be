import type { Context, Next } from 'hono';
import { Access } from '../types/data/access';
import type { SessionData } from '../types/data/session.d.ts';
import { StatusCodes } from '../utils/responses.ts';

const AccessHierachy = {
	admin: ['admin'],
	organizer: ['admin', 'organizer'],
	volunteer: ['admin', 'organizer', 'volunteer']
};

export const createAccessMiddleware = (minimumAcess: Access) => async (context: Context, next: Next) => {
	const session = context.get('session') as SessionData | undefined;

	if (!session) {
		return context.json({ message: 'Session not found' }, StatusCodes.UNAUTHORIZED);
	}

	if (!AccessHierachy[minimumAcess].includes(session.access)) {
		return context.json({ message: 'Forbidden' }, StatusCodes.FORBIDDEN);
	}
	return next();
};

export const authorizeAdmin = createAccessMiddleware(Access.ADMIN);
export const authorizeOrganizer = createAccessMiddleware(Access.ORGANIZER);
export const authorizeVolunteer = createAccessMiddleware(Access.VOLUNTEER);
