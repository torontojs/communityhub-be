import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { authMiddleware } from 'src/middleware/auth';
import { StatusCodes, type StatusResponse, statusResponseFormatter, StatusResponseSchema } from 'src/utils/responses';
import { checkEnvVars } from './validation';

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
		},
		middleware: [authMiddleware] as const
	}),
	(context: Context<EnvironmentBindings>) => {
		const { success, error } = checkEnvVars(context);

		if (context.env.NODE_ENV === 'production') {
			if (success) {
				return context.json({ message: '✅ OK' } satisfies StatusResponse, StatusCodes.OKAY);
			}
			return context.json({ message: '❌ Something is wrong with the server configuration' } satisfies StatusResponse, StatusCodes.INTERNAL_SERVER_ERROR);
		}

		if (success) {
			return context.json({ message: '✅ All environment variables are set' } satisfies StatusResponse, StatusCodes.OKAY);
		}

		const errorMsg = error.issues.map(({ path, message }) => `❌ ${path}: ${message}`).join(', ');
		return context.json({ message: errorMsg } satisfies StatusResponse, StatusCodes.UNPROCESSABLE_CONTENT);
	}
);
