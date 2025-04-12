import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import sgMail from '@sendgrid/mail';
import { type Context, Hono } from 'hono';
import { createSession, deleteSession, getSession, SESSION_COOKIE_NAME } from 'src/utils/auth.ts';
import { getCookie } from 'src/utils/cookie.ts';
import { generateEmailHtml } from '../../email-templates/confirm-email.ts';
import { authMiddleware } from '../../middleware/auth.ts';
import { authorizeVolunteer } from '../../middleware/createMiddleware.ts';
import { type HeartbeatResponse, HeartbeatResponseSchema } from '../../utils/heartbeat.ts';
import { hashPassword, validatePassword } from '../../utils/password-hashing.ts';
import { StatusCodes, type StatusResponse, statusResponseFormatter, StatusResponseSchema } from '../../utils/responses.ts';
import { getProfileById, insertProfile } from '../profile/data.ts';
import { type CreateProfileRequestBody, CreateProfileSchema } from '../profile/validation.ts';
import { activateProfile, checkEmail, getLoginInfo } from './data.ts';
import { ActivateSchema, type SignInData, SignInSchema, SignUpSchema } from './validate.ts';
export const authRoutes = new Hono();

// Public Routes (Post, Get)
export const publicAuthRoutes = new OpenAPIHono<EnvironmentBindings>({
	defaultHook: statusResponseFormatter
});

publicAuthRoutes.openapi(
	createRoute({
		method: 'post',
		path: '/sign-up',
		operationId: 'signUp',
		description: 'Sign up to community hub account',
		tags: ['Sign-up'],
		request: {
			body: { content: { 'application/json': { schema: SignUpSchema } }, required: true }
		},
		responses: {
			[StatusCodes.BAD_REQUEST]: {
				description: 'Invalid JSON format:',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.CONFLICT]: {
				description: 'Duplicate email',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.OKAY]: {
				description: 'Created a new profile and sent an email for confirmation',
				content: { 'application/json': { schema: StatusResponseSchema } }
			}
		}
	}),
	async (context) => {
		let parsedBody: CreateProfileRequestBody;

		try {
			const body = await context.req.json();
			parsedBody = CreateProfileSchema.parse(body);
		} catch (error) {
			if (error instanceof SyntaxError) {
				return context.json({ message: `Invalid JSON format: ${error.message}` } satisfies StatusResponse, StatusCodes.BAD_REQUEST);
			}
			throw error;
		}

		const emailExists = await checkEmail(context.env.database, parsedBody.email);
		if (emailExists) {
			return context.json({ message: 'Duplicate email' } satisfies StatusResponse, StatusCodes.CONFLICT);
		}

		const hashedPasswordWithSalt = await hashPassword(parsedBody.password);

		// Store the hashed password and salt in the database
		parsedBody.password = hashedPasswordWithSalt;
		await insertProfile(context.env.database, parsedBody);

		// Send email
		sgMail.setApiKey(context.env.SENDGRID_API_KEY);

		const token = crypto.randomUUID();
		await context.env.ACTIVATION_TOKENS.put(
			token,
			parsedBody.email,
			{ expirationTtl: 60 * 10 }
		);

		const activationUrl = `${context.env.BASE_URL}/auth/activate?token=${token}`;
		const logoUrl = `${context.env.BASE_URL}/assets/torontojs-logo.png`;
		const emailText = `Please confirm your account by clicking the following link: ${activationUrl}`;
		const emailHtmlTemplate = generateEmailHtml(activationUrl, logoUrl);
		const msg = {
			to: parsedBody.email,
			from: context.env.SENDER_EMAIL,
			subject: '[TorontoJS] Confirm your account',
			text: emailText,
			html: emailHtmlTemplate
		};
		await sgMail.send(msg);

		return context.json({ message: 'Created a new profile and sent an email for confirmation' } satisfies StatusResponse, StatusCodes.OKAY);
	}
);
publicAuthRoutes.openapi(
	createRoute({
		method: 'get',
		path: '/activate',
		operationId: 'activate',
		description: 'Received activation email and clicked on activation link',
		tags: ['Activate'],
		request: {
			params: ActivateSchema
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
			[StatusCodes.NOT_FOUND]: {
				description: 'User nof found',
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
		const { token } = context.req.valid('param');
		if (!token) {
			return context.json({ message: 'Invalid or missing token' }, StatusCodes.BAD_REQUEST);
		}

		const email = await context.env.ACTIVATION_TOKENS.get(token);
		if (!email) {
			return context.json({ message: 'Invalid or expired token' }, StatusCodes.UNAUTHORIZED);
		}

		const emailExists = await checkEmail(context.env.database, email);
		if (!emailExists) {
			return context.json({ message: 'User not found' }, StatusCodes.NOT_FOUND);
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

publicAuthRoutes.openapi(
	createRoute({
		method: 'post',
		path: '/sign-in',
		operationId: 'signIn',
		description: 'Sign in to community hub account',
		tags: ['Sign-in'],
		request: {
			body: { content: { 'application/json': { schema: SignInSchema } }, required: true }
		},
		responses: {
			[StatusCodes.BAD_REQUEST]: {
				description: 'Invalid JSON format or already signed in',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.UNAUTHORIZED]: {
				description: 'InValid email, profile Id, password or account not activated ',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.CREATED]: {
				description: 'Sign in succesful',
				content: { 'application/json': { schema: StatusResponseSchema } }
			}
		}
	}),
	async (context) => {
		const existingSession = await getSession(context);

		if (existingSession) {
			return context.json({ message: 'You are already signed in' } satisfies StatusResponse, StatusCodes.BAD_REQUEST);
		}

		let parsedBody: SignInData;

		try {
			const body = await context.req.json();
			parsedBody = SignInSchema.parse(body);
		} catch (error) {
			if (error instanceof SyntaxError) {
				return context.json({ message: `Invalid JSON format: ${error.message}` } satisfies StatusResponse, StatusCodes.BAD_REQUEST);
			}
			throw error;
		}

		const genericSignInResponse = { message: 'Either your email/password combination is invalid, or your account is not active' };

		const results = await getLoginInfo(context.env.database, parsedBody.email);

		if (!results) {
			return context.json(genericSignInResponse satisfies StatusResponse, StatusCodes.UNAUTHORIZED);
		}

		const {
			storedPassword,
			accessLevel,
			profileId
		} = results;

		if (!storedPassword) {
			return context.json(genericSignInResponse satisfies StatusResponse, StatusCodes.UNAUTHORIZED);
		}

		const isValid = await validatePassword(parsedBody.password, storedPassword);
		if (!isValid) {
			return context.json(genericSignInResponse satisfies StatusResponse, StatusCodes.UNAUTHORIZED);
		}

		const session = {
			id: profileId,
			email: parsedBody.email,
			access: accessLevel
		};

		await createSession({ session, context });

		return context.json({ message: 'Sign in successful' } satisfies StatusResponse, StatusCodes.CREATED);
	}
);

// Protected auth routes
export const protectedAuthRoutes = new OpenAPIHono<EnvironmentBindings>({
	defaultHook: statusResponseFormatter
});

protectedAuthRoutes.openapi(
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
		const sessionData = context.get('session');

		if (!sessionData) {
			return context.json({ message: 'Invalid session' } satisfies StatusResponse, StatusCodes.UNAUTHORIZED);
		}

		const profile = await getProfileById(context.env.database, sessionData.id);

		if (!profile) {
			return context.json({ message: 'Internal error getting profile that should exist' } satisfies StatusResponse, StatusCodes.NOT_FOUND);
		}
		const { name } = profile;
		const { access } = sessionData;

		// STUB: Avatar upload and resource under construction
		const avatar = 'https://gravatar.com/avatar/f8eb6ba9cc4ad24f3b79897a8596ee90?s=400&d=robohash&r=x';

		return context.json({ access, name, avatar } satisfies HeartbeatResponse, StatusCodes.OKAY);
	}
);

authRoutes.post('/sign-out', async (context: Context<EnvironmentBindings>) => {
	const session = await getSession(context);

	if (!session) {
		return context.json({ message: 'Invalid or missing token' }, StatusCodes.BAD_REQUEST);
	}

	const sessionToken = getCookie({ context, name: SESSION_COOKIE_NAME });

	if (!sessionToken) {
		return context.json({ message: 'Invalid or missing token' }, StatusCodes.BAD_REQUEST);
	}

	await deleteSession({ context, sessionToken });
	return context.json(StatusCodes.NO_CONTENT);
});
