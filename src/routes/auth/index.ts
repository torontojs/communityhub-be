import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { createSession, deleteSession, getSession } from 'src/utils/auth.ts';
import { sendAccountConfirmationEmail } from '../../email/index.ts';
import { authorizeVolunteer } from '../../middleware/access.ts';
import { authMiddleware } from '../../middleware/auth.ts';
import { hashPassword, validatePassword } from '../../utils/password-hashing.ts';
import { StatusCodes, type StatusResponse, statusResponseFormatter, StatusResponseSchema } from '../../utils/responses.ts';
import { insertProfile } from '../profile/data.ts';
import { activateProfile, checkActiveEmail, checkExistingEmail, getHeartbeatInfo, getLoginInfo } from './data.ts';
import { type HeartbeatResponse, HeartbeatResponseSchema } from './responses.ts';
import { ActivateSchema, SignInSchema, SignUpSchema } from './validation.ts';

export const authRoutes = new OpenAPIHono<EnvironmentBindings>({
	defaultHook: statusResponseFormatter
});

authRoutes.openapi(
	createRoute({
		method: 'post',
		path: '/sign-up',
		operationId: 'Create account',
		summary: 'Create a new Community Hub account.',
		description: 'This is the entry point for the Community Hub. It allows users to register new accounts.',
		tags: ['Authentication'],
		request: {
			body: { content: { 'application/json': { schema: SignUpSchema } }, required: true }
		},
		responses: {
			[StatusCodes.OKAY]: {
				description: 'Created a new profile and sent an email for confirmation',
				content: { 'application/json': { schema: StatusResponseSchema } }
			}
		}
	}),
	async (context) => {
		const { email, password, name } = context.req.valid('json');
		const response = { message: 'Created a new profile and sent an email for confirmation' };

		const emailExists = await checkExistingEmail(context.env.database, email);
		if (emailExists) {
			// INFO: Hide non existing emails to reduce attack surface from guessing registered emails.
			return context.json(response satisfies StatusResponse, StatusCodes.OKAY);
		}

		const hashedPasswordWithSalt = await hashPassword(password);
		await insertProfile(context.env.database, { email, password: hashedPasswordWithSalt, name });

		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		const TEN_MINUTES_IN_SECONDS = 60 * 10;
		const token = crypto.randomUUID();
		await context.env.ACTIVATION_TOKENS.put(
			token,
			email,
			{ expirationTtl: TEN_MINUTES_IN_SECONDS }
		);

		await sendAccountConfirmationEmail({
			apiKey: context.env.SENDGRID_API_KEY,
			baseUrl: context.env.BASE_URL,
			senderEmail: context.env.SENDER_EMAIL,
			token,
			email
		});

		return context.json(response satisfies StatusResponse, StatusCodes.OKAY);
	}
);

authRoutes.openapi(
	createRoute({
		method: 'get',
		path: '/activate',
		operationId: 'Activate account',
		summary: 'Activate a newly created account.',
		description: 'Received activation email and clicked on activation link.',
		tags: ['Authentication'],
		request: {
			query: ActivateSchema
		},
		responses: {
			[StatusCodes.BAD_REQUEST]: {
				description: 'Invalid or missing token',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.UNAUTHORIZED]: {
				description: 'Invalid or expired token',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.INTERNAL_SERVER_ERROR]: {
				description: 'Failed to activate account',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.OKAY]: {
				description: 'Account activated successfully',
				content: { 'application/json': { schema: StatusResponseSchema } }
			}
		}
	}),
	async (context) => {
		const { token } = context.req.valid('query');
		if (!token) {
			return context.json({ message: 'Invalid or missing token' }, StatusCodes.BAD_REQUEST);
		}

		const email = await context.env.ACTIVATION_TOKENS.get(token);
		if (!email) {
			return context.json({ message: 'Invalid or expired token' }, StatusCodes.UNAUTHORIZED);
		}

		const userAlreadyActivated = await checkActiveEmail(context.env.database, email);
		if (!userAlreadyActivated) {
			// INFO: Hide non existing emails to reduce attack surface from guessing registered emails.
			return context.json({ message: 'Account activated successfully' } satisfies StatusResponse, StatusCodes.OKAY);
		}

		const activated = await activateProfile(context.env.database, email);
		if (!activated) {
			return context.json({ message: 'Failed to activate account' }, StatusCodes.INTERNAL_SERVER_ERROR);
		}

		// Remove token after successful activation
		await context.env.ACTIVATION_TOKENS.delete(token);

		return context.json({ message: 'Account activated successfully' } satisfies StatusResponse, StatusCodes.OKAY);
	}
);

authRoutes.openapi(
	createRoute({
		method: 'post',
		path: '/sign-in',
		operationId: 'Sign-in',
		summary: 'Sign in to Community Hub account.',
		description: 'Signs the user in to the Community Hub.',
		tags: ['Authentication'],
		request: {
			body: { content: { 'application/json': { schema: SignInSchema } }, required: true }
		},
		responses: {
			[StatusCodes.UNAUTHORIZED]: {
				description: 'Invalid email, profile Id, password or account not activated.',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.CREATED]: {
				description: 'Sign in succesful',
				content: { 'application/json': { schema: StatusResponseSchema } }
			}
		}
	}),
	async (context) => {
		const { email, password } = context.req.valid('json');

		const genericSignInResponse = { message: 'Either your email/password combination is invalid, or your account is not active' };

		const results = await getLoginInfo(context.env.database, email);
		if (!results) {
			// INFO: Hide specific errors to reduce attack surface and avoid guessing.
			return context.json(genericSignInResponse satisfies StatusResponse, StatusCodes.UNAUTHORIZED);
		}

		const { password: storedPassword, access, id } = results;
		if (!storedPassword) {
			// INFO: Hide specific errors to reduce attack surface and avoid guessing.
			return context.json(genericSignInResponse satisfies StatusResponse, StatusCodes.UNAUTHORIZED);
		}

		const isValid = await validatePassword(password, storedPassword);
		if (!isValid) {
			// INFO: Hide specific errors to reduce attack surface and avoid guessing.
			return context.json(genericSignInResponse satisfies StatusResponse, StatusCodes.UNAUTHORIZED);
		}

		await createSession({ id, email, access, context });

		return context.json({ message: 'Sign in successful' } satisfies StatusResponse, StatusCodes.CREATED);
	}
);

authRoutes.openapi(
	createRoute({
		method: 'get',
		path: '/heartbeat',
		operationId: 'getHeartbeat',
		summary: 'Check if authenticated and get name, avatar and access',
		descrition: 'Every protected UI page will make a heartbeat check and if successful will receive name, avatar and access in order to generate custsom content',
		tags: ['heartbeat'],
		responses: {
			[StatusCodes.NOT_FOUND]: {
				description: 'Internal error getting profile that should exist',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.UNAUTHORIZED]: {
				description: 'No cookies found, invalid or missing token, invalid session or session expired. ',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.OKAY]: {
				description: 'Heartbeat succesful. User authenticted and name, avatar and access returned to Client.',
				content: { 'application/json': { schema: HeartbeatResponseSchema } }
			}
		},
		middleware: [authMiddleware, authorizeVolunteer] as const
	}),
	async (context) => {
		const sessionData = getSession(context);

		const heartbeatInfo = await getHeartbeatInfo(context.env.database, sessionData.id);
		if (!heartbeatInfo) {
			return context.json({ message: 'Internal error getting profile that should exist' } satisfies StatusResponse, StatusCodes.NOT_FOUND);
		}

		return context.json(heartbeatInfo satisfies HeartbeatResponse, StatusCodes.OKAY);
	}
);

authRoutes.openapi(
	createRoute({
		method: 'post',
		path: '/sign-out',
		operationId: 'Sign-out',
		summary: 'Signs the user out.',
		description: 'Signs the user out from this device, removing the current session.',
		tags: ['Authorization'],
		responses: {
			[StatusCodes.BAD_REQUEST]: {
				description: 'Invalid token is provided.',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.NO_CONTENT]: {
				description: 'The user is successfully logged out.'
			}
		},
		middleware: [authMiddleware] as const
	}),
	async (context) => {
		const session = getSession(context);

		await deleteSession({ context, sessionToken: session.token });

		return context.json(StatusCodes.NO_CONTENT);
	}
);
