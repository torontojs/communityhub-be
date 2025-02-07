import { type Context, Hono } from 'hono';

// Import { setCookie } from 'hono/cookie';
import sgMail from '@sendgrid/mail';
import argon2 from 'argon2';
import { ZodError } from 'zod';
import { emailHtmlTemplate } from '../../email-templates/confirm-email.ts';
import { StatusCodes, type StatusResponse } from '../../utils/responses.ts';
import { insertProfile } from '../profile/data.ts';
import { CreateProfileSchema } from '../profile/validation.ts';
import { authenticate } from './data.ts';
import { SignInSchema } from './validate.ts';

export const authRoutes = new Hono();

authRoutes.post('/sign-up', async (context: Context<EnvironmentBindings>) => {
	const body = await context.req.json();
	const parsedBody = CreateProfileSchema.parse(body);
	// TODO Check BAD_REQUEST
	// Create Profile
	try {
		const hashedPassword = await argon2.hash(parsedBody.password);
		parsedBody.password = hashedPassword;
		await insertProfile({ payload: parsedBody, database: context.env.database });
	} catch (error) {
		console.error('Error creating profile', error);
		return context.json<StatusResponse>({ message: 'Error creating profile' }, StatusCodes.INTERNAL_SERVER_ERROR);
	}

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

		const hashedPassword = await authenticate(context.env.database, parsedBody);

		if (!hashedPassword) {
			return context.json<StatusResponse>({ message: 'Unauthorized requests' }, StatusCodes.UNAUTHORIZED);
		}

		const isVerified = await argon2.verify(hashedPassword, parsedBody.password);

		if (!isVerified) {
			return context.json<StatusResponse>({ message: 'Unauthorized' }, StatusCodes.UNAUTHORIZED);
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
