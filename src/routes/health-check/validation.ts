import type { Context } from 'hono';
import { z } from 'zod';
import type { ZodSchema } from 'zod';
type EnvKeys = keyof EnvVars;

// NOTE: please update the schema of new environment variables here
const envSchema = z.object(
	{
		BASE_URL: z
			.string({ message: 'required for the server to run' })
			.url({ message: 'must be a valid URL' }),
		SENDER_EMAIL: z
			.string({ message: 'required for emails to be sent' })
			.email({ message: 'must be a valid email address' }),
		SENDGRID_API_KEY: z
			.string({ message: 'required for emails to be sent' })
			.min(1, { message: 'required for emails to be sent' }),
		NODE_ENV: z
			.enum(['development', 'local', 'production'], { message: 'must be one of the following: development, local, production' })
	} satisfies Record<EnvKeys, ZodSchema>
);

function checkEnvVars(env: Context<EnvironmentBindings>['env']) {
	return envSchema.safeParse(env);
}

export {
	checkEnvVars
};
