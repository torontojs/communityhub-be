import type { Context, Next } from 'hono';
import type { Session } from '../types/data/session.d.ts';
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

export const authorizationAdmine = createAccessMiddlware('admin');
export const authorizationOrganizer = createAccessMiddlware('organizer');
export const authorizationVolunteer = createAccessMiddlware('volunteer');
