import sgMail from '@sendgrid/mail';
import { type Context, Hono } from 'hono';
import { generateEmailHtml } from '../../email-templates/confirm-email.ts';
import { hashPassword, validatePassword } from '../../utils/password-hashing.ts';
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

	const hashedPasswordWithSalt = await hashPassword(parsedBody.password);

	// Store the hashed password and salt in the database
	parsedBody.password = hashedPasswordWithSalt;
	await insertProfile({ payload: parsedBody, database: context.env.database });

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

	const hashedPasswordWithSalt = await getPassword(context.env.database, parsedBody);
	if (!hashedPasswordWithSalt) {
		return context.json<StatusResponse>({ message: 'Invalid email or password' }, StatusCodes.UNAUTHORIZED);
	}

	const isValid = await validatePassword(parsedBody.password, hashedPasswordWithSalt);
	if (!isValid) {
		return context.json<StatusResponse>({ message: 'Invalid email or password' }, StatusCodes.UNAUTHORIZED);
	}

	const sessionToken = crypto.randomUUID();
	const hoursAhead = 1;
	const tokenExpiryISO = new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString();
	const sessionData = JSON.stringify({
		expiry: tokenExpiryISO,
		email: parsedBody.email
	});
	await context.env.SESSION_TOKENS.put(sessionToken, sessionData);

	context.header('Set-Cookie', `auth_token=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Expires=${tokenExpiryISO}; Path=/;`);

	return context.json<StatusResponse>({ message: 'Authorized successfully', data: sessionToken }, StatusCodes.CREATED);
});
