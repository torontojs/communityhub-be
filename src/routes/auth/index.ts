import { type Context, Hono } from 'hono';

// Import { setCookie } from 'hono/cookie';
import sgMail from '@sendgrid/mail';
import { ZodError } from 'zod';
import { generateEmailHtml } from '../../email-templates/confirm-email.ts';
import { hashPasswordPBKDF2 } from '../../utils/hashPassword.ts';
import { StatusCodes, type StatusResponse } from '../../utils/responses.ts';
import { insertProfile } from '../profile/data.ts';
import { CreateProfileSchema } from '../profile/validation.ts';
import { authenticate } from './data.ts';
import { SignInSchema } from './validate.ts';

export const authRoutes = new Hono();

authRoutes.post('/sign-up', async (context: Context<EnvironmentBindings>) => {
	const body = await context.req.json();
	const parsedBody = CreateProfileSchema.parse(body);
	// TODO : check ZodError and return BAD_REQUEST
	// TODO : Check duplicate email

	// Create Profile
	try {
		// Generate salt (16 bytes)
		const salt = crypto.getRandomValues(new Uint8Array(16));

		// Hash password with PBKDF2
		const hashedPassword = await hashPasswordPBKDF2(parsedBody.password, salt);

		// Convert salt to Base64 for storage
		const saltBase64 = btoa(String.fromCharCode(...salt));

		// Store the hashed password and salt in the database
		parsedBody.password = `${saltBase64}:${hashedPassword}`;
		await insertProfile({ payload: parsedBody, database: context.env.database });
	} catch (error) {
		console.error('Error creating profile', error);
		return context.json<StatusResponse>({ message: 'Error creating profile' }, StatusCodes.INTERNAL_SERVER_ERROR);
	}

	// Send email
	try {
		sgMail.setApiKey(context.env.SENDGRID_API_KEY);

		const token = '';
		const emailHtmlTemplate = generateEmailHtml(context, token);

		const msg = {
			to: parsedBody.email,
			from: context.env.SENDER_EMAIL,
			subject: '[TorontoJS] Confirm your account',
			html: emailHtmlTemplate
		};
		await sgMail.send(msg);

		return context.json<StatusResponse>({ message: 'Sent an email successfully' }, StatusCodes.OKAY);
	} catch (error) {
		console.error('Error sending email', error);
		return context.json<StatusResponse>({ message: 'Error sending email' }, StatusCodes.INTERNAL_SERVER_ERROR);
	}
});

authRoutes.post('/sign-in', async (context: Context<EnvironmentBindings>) => {
	try {
		const body = await context.req.json();
		const parsedBody = SignInSchema.parse(body);

		const storedPassword = await authenticate(context.env.database, parsedBody);

		if (!storedPassword) {
			return context.json<StatusResponse>({ message: 'Unauthorized requests' }, StatusCodes.UNAUTHORIZED);
		}

		// Extract salt and hashed password from stored format
		const [saltBase64, storedHashedPassword] = storedPassword.split(':');
		if (saltBase64 === undefined) {
			throw new Error('Salt not found');
		}
		const salt = new Uint8Array([...atob(saltBase64)].map((c) => c.charCodeAt(0)));

		// Hash input password with the same salt
		const inputHashedPassword = await hashPasswordPBKDF2(parsedBody.password, salt);

		// Verify if the input password matches the stored password
		if (inputHashedPassword !== storedHashedPassword) {
			return context.json<StatusResponse>({ message: 'Unauthorized' }, StatusCodes.UNAUTHORIZED);
		}

		const sessionToken = crypto.randomUUID();
		const hoursAhead = 1;
		const tokenExpiry = String(Date.now() + hoursAhead * 60 * 60 * 1000);
		const expiryAndUserEmail = `${tokenExpiry} ${parsedBody.email}`;
		await context.env.SESSION_TOKENS.put(sessionToken, expiryAndUserEmail);

		context.header('Set-Cookie', `auth_token=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Expires=${tokenExpiry}; Path=/; Domain=torontojs.com`);

		return context.json<StatusResponse>({ message: 'Authorized successfully', data: sessionToken }, StatusCodes.CREATED);
	} catch (err) {
		if (err instanceof ZodError) {
			return context.json<StatusResponse>({ message: err?.message ?? 'Invalid input' }, StatusCodes.BAD_REQUEST);
		}
		return context.json<StatusResponse>({ message: err?.message ?? 'An error has occurred' }, StatusCodes.INTERNAL_SERVER_ERROR);
	}
});
