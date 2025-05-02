import { Resend } from 'resend';

interface AccountConfirmationEmailParams {
	baseUrl: string;
	token: string;
	email: string;
	apiKey: string;
	senderEmail: string;
}

export async function sendAccountConfirmationEmail({
	baseUrl,
	token,
	email,
	apiKey,
	senderEmail
}: AccountConfirmationEmailParams) {
	const resend = new Resend(apiKey);
	const activationUrl = `${baseUrl}/auth/activate?token=${token}`;

	const emailResponse = await resend.emails.send({
		from: senderEmail,
		to: email,
		subject: '[TorontoJS] Confirm your account',
		text: `You are now one of us!\n\nPlease activate your account by visiting: ${activationUrl}`,
		html: `
			<h2>You are now one of us!</h2>
			<p>Please activate your account by visiting the link below</p>
			<p><a href="${activationUrl}">${activationUrl}</a></p>
		`
	});

	console.log({
		email,
		token
	});

	return emailResponse;
}
