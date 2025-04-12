interface AccountConfirmationEmailParams {
	baseUrl: string;
	token: string;
	email: string;
	apiKey: string;
	senderEmail: string;
}

export async function sendAccountConfirmationEmail({
	baseUrl: _baseUrl,
	token,
	email,
	apiKey: _apiKey,
	senderEmail: _senderEmail
}: AccountConfirmationEmailParams) {
	console.log({
		email,
		token
	});

	return Promise.resolve(undefined);

	// TODO: update email service
	// SgMail.setApiKey(apiKey);

	// Const activationUrl = `${baseUrl}/auth/activate?token=${token}`;
	// Const logoUrl = `${baseUrl}/assets/torontojs-logo.png`;
	// Const emailText = `Please confirm your account by clicking the following link: ${activationUrl}`;
	// Const emailHtmlTemplate = generateEmailHtml(activationUrl, logoUrl);
	// Const msg = {
	// 	To: email,
	// 	From: senderEmail,
	// 	Subject: '[TorontoJS] Confirm your account',
	// 	Text: emailText,
	// 	Html: emailHtmlTemplate
	// };
	// Await sgMail.send(msg);
}
