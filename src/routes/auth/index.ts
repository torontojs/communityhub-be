import sgMail from '@sendgrid/mail';
import { type Context, Hono } from 'hono';
import { generateEmailHtml } from '../../email-templates/confirm-email.ts';
import { hashPasswordPBKDF2 } from '../../utils/hashPassword.ts';
import { StatusCodes, type StatusResponse } from '../../utils/responses.ts';
import { insertProfile } from '../profile/data.ts';
import { type CreateProfileRequestBody, CreateProfileSchema } from '../profile/validation.ts';
import { activateProfile, checkEmail, getPassword } from './data.ts';
import { type SignInData, SignInSchema } from './validate.ts';

export const authRoutes = new Hono();

authRoutes.post('/sign-up', async (context: Context<EnvironmentBindings>) => {
	let parsedBody: CreateProfileRequestBody;

	try {
		const body = await context.req.json();
		parsedBody = CreateProfileSchema.parse(body);
	} catch (error) {
		if (error instanceof SyntaxError) {
			return context.json<StatusResponse>({ message: `Invalid JSON format: ${error.message}` }, StatusCodes.BAD_REQUEST);
		}
		throw error;
	}

	const emailExists = await checkEmail(context.env.database, parsedBody.email);
	if (emailExists) {
		return context.json<StatusResponse>({ message: 'Duplicate email' }, StatusCodes.CONFLICT);
	}

	// Create Profile
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const hashedPassword = await hashPasswordPBKDF2(parsedBody.password, salt);
	// Convert salt to Base64 for storage
	const saltBase64 = btoa(String.fromCharCode(...salt));

	// Store the hashed password and salt in the database
	parsedBody.password = `${saltBase64}:${hashedPassword}`;
	await insertProfile({ payload: parsedBody, database: context.env.database });

	// Send email
	sgMail.setApiKey(context.env.SENDGRID_API_KEY);

	const token = await hashPasswordPBKDF2(parsedBody.email, salt);
	const encodedToken = encodeURIComponent(token);
	await context.env.ACTIVATION_TOKENS.put(
		encodedToken,
		parsedBody.email,
		{ expirationTtl: 60 * 10 }
	);

	const emailHtmlTemplate = generateEmailHtml(context, encodedToken);
	const msg = {
		to: parsedBody.email,
		from: context.env.SENDER_EMAIL,
		subject: '[TorontoJS] Confirm your account',
		html: emailHtmlTemplate
	};
	await sgMail.send(msg);

	return context.json<StatusResponse>({ message: 'Created a new profile and sent an email for confirmation' }, StatusCodes.OKAY);
});

authRoutes.get('/activate', async (context: Context<EnvironmentBindings>) => {
	const token = context.req.query('token');
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

	await activateProfile(context.env.database, email);

	// Remove token after successful activation
	await context.env.ACTIVATION_TOKENS.delete(token);

	return context.json({ message: 'Account activated successfully' }, StatusCodes.OKAY);
});

authRoutes.post('/sign-in', async (context: Context<EnvironmentBindings>) => {
	let parsedBody: SignInData;

	try {
		const body = await context.req.json();
		parsedBody = SignInSchema.parse(body);
	} catch (error) {
		if (error instanceof SyntaxError) {
			return context.json<StatusResponse>({ message: `Invalid JSON format: ${error.message}` }, StatusCodes.BAD_REQUEST);
		}
		throw error;
	}

	const storedPassword = await getPassword(context.env.database, parsedBody);

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

	// Generate session token
	const sessionToken = crypto.randomUUID();
	const hoursAhead = 1;
	const tokenExpiry = String(Date.now() + hoursAhead * 60 * 60 * 1000);
	const expiryAndUserEmail = `${tokenExpiry} ${parsedBody.email}`;
	await context.env.SESSION_TOKENS.put(sessionToken, expiryAndUserEmail);

	context.header('Set-Cookie', `auth_token=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Expires=${tokenExpiry}; Path=/; Domain=torontojs.com`);

	return context.json<StatusResponse>({ message: 'Authorized successfully', data: sessionToken }, StatusCodes.CREATED);
});
