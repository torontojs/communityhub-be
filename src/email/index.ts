import sgMail from '@sendgrid/mail';
import { generateEmailHtml } from '../email-templates/confirm-email.ts';

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
	sgMail.setApiKey(apiKey);

	const activationUrl = `${baseUrl}/auth/activate?token=${token}`;
	const logoUrl = `${baseUrl}/assets/torontojs-logo.png`;
	const emailText = `Please confirm your account by clicking the following link: ${activationUrl}`;
	const emailHtmlTemplate = generateEmailHtml(activationUrl, logoUrl);
	const msg = {
		to: email,
		from: senderEmail,
		subject: '[TorontoJS] Confirm your account',
		text: emailText,
		html: emailHtmlTemplate
	};
	await sgMail.send(msg);
}
