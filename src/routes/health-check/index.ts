import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { StatusCodes, statusResponseFormatter, StatusResponseSchema } from 'src/utils/responses';
import type { HealthCheckResponse } from './responses';
import { checkEnvVars } from './validation';

export const healthCheckRoutes = new OpenAPIHono<EnvironmentBindings>({
	defaultHook: statusResponseFormatter
});

healthCheckRoutes.openapi(
	createRoute({
		method: 'get',
		path: '/',
		operationId: 'Health-check',
		summary: 'Get server status.',
		description: 'Checks if the server is missing any environment variables needed for it to run correctly.',
		tags: ['Server status'],
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
		const { success, message, warning } = checkEnvVars(context.env);

		if (context.env.NODE_ENV === 'production') {
			if (success) {
				return context.json({ message: '✅ OK' } satisfies HealthCheckResponse, StatusCodes.OKAY);
			}
			return context.json({ message: '❌ Something is wrong with the server configuration' } satisfies HealthCheckResponse, StatusCodes.INTERNAL_SERVER_ERROR);
		}

		if (success) {
			return context.json({ message, warning } satisfies HealthCheckResponse, StatusCodes.OKAY);
		}

		return context.json({ message } satisfies HealthCheckResponse, StatusCodes.UNPROCESSABLE_CONTENT);
	}
);
