import type { Context, Next } from 'hono';

export async function checkEnvVarsPresentOrThrow(context: Context, next: Next) {
	type EnvToCheck = Omit<
		EnvVars,
		'ACTIVATION_TOKENS' | 'ASSETS' | 'database' | 'SESSION_TOKENS'
	>;

	const env: EnvToCheck = {
		BASE_URL: context.env.BASE_URL,
		SENDER_EMAIL: context.env.SENDER_EMAIL,
		SENDGRID_API_KEY: context.env.SENDGRID_API_KEY
	};

	// TODO: support development environment later (maybe production?)
	if (context.env.NODE_ENV !== 'local') {
		return next();
	}

	if (!env.BASE_URL) {
		throw new Error('❌ BASE_URL is not set which is needed to run the server');
	}

	if (!env.SENDER_EMAIL) {
		throw new Error('❌ SENDER_EMAIL is not set which is needed to send emails');
	}

	if (!env.SENDGRID_API_KEY) {
		throw new Error('❌ SENDGRID_API_KEY is not set which is needed to send emails');
	}
	return next();
}
