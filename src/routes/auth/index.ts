import { type Context, Hono } from 'hono';

// Import { setCookie } from 'hono/cookie';
import sgMail from '@sendgrid/mail';
import { ZodError } from 'zod';
import { emailHtmlTemplate } from '../../email-templates/confirm-email.ts';
import { StatusCodes, type StatusResponse } from '../../utils/responses.ts';
import { CreateProfileSchema } from '../profile/validation.ts';
import { authenticate } from './data.ts';
import { SignInSchema } from './validate.ts';

export const authRoutes = new Hono();

authRoutes.post('/sign-up', async (context: Context<EnvironmentBindings>) => {
	const body = await context.req.json();
	const parsedBody = CreateProfileSchema.parse(body);

	// Create profile

	// Send email
	try {
		sgMail.setApiKey(context.env.SENDGRID_API_KEY);
		const msg = {
			to: parsedBody.email,
			// TODO : Change to your verified sender
			from: 'jsi04049@gmail.com',
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

// Type UserIdExpiryTimeStampType;

authRoutes.post('/sign-in', async (context: Context<EnvironmentBindings>) => {
	try {
		const body = await context.req.json();
		const parsedBody = SignInSchema.parse(body);

		const userId = await authenticate(context.env.database, parsedBody);

		if (!userId) {
			return context.json<StatusResponse>({ message: 'Authorized requests' }, StatusCodes.UNAUTHORIZED);
		}

		const sessionToken = crypto.randomUUID();
		const hoursAhead = 1;
		const futureTimestamp = String(Date.now() + hoursAhead * 60 * 60 * 1000);
		await context.env.kv.put(sessionToken, futureTimestamp);

		return context.json<StatusResponse>({ message: 'Authorized successfully', data: sessionToken }, StatusCodes.CREATED);
	} catch (err) {
		if (err instanceof ZodError) {
			return context.json<StatusResponse>({ message: err?.message ?? 'Invalid input' }, StatusCodes.BAD_REQUEST);
		}
		return context.json<StatusResponse>({ message: err?.message ?? 'An error has occurred' }, StatusCodes.INTERNAL_SERVER_ERROR);
	}
});
