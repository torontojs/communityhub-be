import type { Context } from 'hono';
import { z } from 'zod';

// NOTE: please update the schema of new environment variables here

export const NodeEnvSchema = z.enum(
	['development', 'local', 'production'],
	{ message: 'must be one of the following: development, local, production' }
);

export type NodeEnv = z.infer<typeof NodeEnvSchema>;

export const EnvSchema = z.object({
	BASE_URL: z
		.string({ message: 'required for the server to run' })
		.url({ message: 'must be a valid URL' }),
	SENDER_EMAIL: z
		.string({ message: 'required for emails to be sent' })
		.email({ message: 'must be a valid email address' }),
	SENDGRID_API_KEY: z
		.string({ message: 'required for emails to be sent' })
		.min(1, { message: 'required for emails to be sent' }),
	NODE_ENV: NodeEnvSchema
}).passthrough();

export type EnvVars = z.infer<typeof EnvSchema>;

export function checkEnvVars(env: Context<EnvironmentBindings>['env']) {
	const { success, error, data: parsedEnv } = EnvSchema.safeParse(env);

	if (success) {
		const allEnvVars = Object.keys(parsedEnv);
		const expectedEnvVars = Object.keys(EnvSchema.shape);

		const unexpectedEnvVars = allEnvVars
			.filter((variable) => !expectedEnvVars.includes(variable));

		return {
			success: true,
			message: `✅ All required environment variables are set`,
			warning: `🤷 These variables may not be in use: ${unexpectedEnvVars.join(', ')}`
		};
	}

	const errorMsg = error.issues.map(({ path, message }) => `${path}: ${message}`).join('. ');
	return {
		success: false,
		message: `❌ Required variables missing: ${errorMsg}`
	};
}
