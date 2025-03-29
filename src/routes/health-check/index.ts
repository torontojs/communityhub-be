import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { StatusCodes, type StatusResponse, statusResponseFormatter, StatusResponseSchema } from 'src/utils/responses';
import type { ZodSchema } from 'zod';

export const healthCheckRoutes = new OpenAPIHono<EnvironmentBindings>({
	defaultHook: statusResponseFormatter
});

healthCheckRoutes.openapi(
	createRoute({
		method: 'get',
		path: '/',
		operationId: 'getHealthCheck',
		summary: 'Get health check',
		description: 'Checks if the server is missing any environment variables needed for it to run correctly.',
		tags: ['Health Check'],
		responses: {
			[StatusCodes.OKAY]: {
				description: 'Successful response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.INTERNAL_SERVER_ERROR]: {
				description: 'Error response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			},
			[StatusCodes.UNPROCESSABLE_CONTENT]: {
				description: 'Error response',
				content: { 'application/json': { schema: StatusResponseSchema } }
			}
		}
	}),
	(context: Context<EnvironmentBindings>) => {
		type EnvToCheck = Omit<
			EnvVars,
			'ACTIVATION_TOKENS' | 'ASSETS' | 'database' | 'SESSION_TOKENS'
		>;

		type EnvKeys = keyof EnvToCheck;

		// NOTE: please add new environment variables here
		const env: EnvToCheck = {
			BASE_URL: context.env.BASE_URL,
			SENDER_EMAIL: context.env.SENDER_EMAIL,
			SENDGRID_API_KEY: context.env.SENDGRID_API_KEY,
			NODE_ENV: context.env.NODE_ENV
		};

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

		const result = envSchema.safeParse(env);

		if (context.env.NODE_ENV === 'production') {
			if (result.success) {
				return context.json({ message: '✅ OK' } satisfies StatusResponse, StatusCodes.OKAY);
			}
			return context.json({ message: '❌ Something is wrong with the server configuration' } satisfies StatusResponse, StatusCodes.INTERNAL_SERVER_ERROR);
		}

		if (result.success) {
			return context.json({ message: '✅ All environment variables are set' } satisfies StatusResponse, StatusCodes.OKAY);
		}

		const processedErrorMsg = result.error.issues.map(({ path, message }) => `❌ ${path}: ${message}`).join(', ');

		return context.json({ message: processedErrorMsg } satisfies StatusResponse, StatusCodes.UNPROCESSABLE_CONTENT);
	}
);
