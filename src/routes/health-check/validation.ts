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
		.string({ message: 'Required for the server to run' })
		.url({ message: 'Must be a valid URL.' }),
	SENDER_EMAIL: z
		.string({ message: 'Required for emails to be sent.' })
		.email({ message: 'Must be a valid email address.' }),
	/** @deprecated */
	SENDGRID_API_KEY: z
		.string({ message: 'Required for emails to be sent.' })
		.min(1, { message: 'Required for emails to be sent.' }),
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
			message: `✅ All required environment variables are set`,
			warnings: unexpectedEnvVars.map((envVar) => ({
				message: '🤷 This variable may not be in use',
				variable: envVar
			}))
		};
	}

	return {
		message: '❌ Required variables missing',
		errors: error.issues.map(({ path, message }) => ({
			path: path.toString(),
			message
		}))
	};
}
