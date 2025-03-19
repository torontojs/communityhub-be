import { OpenAPIHono } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { cors } from 'hono/cors';
import packageJson from '../package.json';
import { authMiddleware } from './middleware/auth.ts';
import { authRoutes } from './routes/auth/index.ts';
import { protectedProfileRoutes, publicProfileRoutes } from './routes/profile/index.ts';
import { roleRoutes } from './routes/role/index.ts';
import { teamRoutes } from './routes/team/index.ts';
import { StatusCodes, statusResponseFormatter } from './utils/responses.ts';

const app = new OpenAPIHono<EnvironmentBindings>({
	defaultHook: statusResponseFormatter
});

// Catch all error handler.
app.onError((err, context) => {
	// TODO: add better error logging?
	console.error(err);

	return context.json({ message: 'An error has occured' }, StatusCodes.INTERNAL_SERVER_ERROR);
});

// CORS middleware22
app.use(
	'/*',
	cors({
		// FIXME: We want to block origins external to Toronto JS
		origin: '*',
		allowMethods: ['POST', 'GET', 'OPTIONS', 'DELETE', 'PATCH'],
		allowHeaders: ['Content-Type']
	})
);

app.doc('/open-api.json', {
	openapi: '3.0.0',
	servers: [
		{
			url: 'https://vms.torontojs.com/',
			description: 'Production server.'
		},
		{
			url: 'http://localhost:8787/',
			description: 'Local server for development.'
		}
	],
	info: {
		title: 'Toronto JS Community Hub API',
		version: packageJson.version,
		description: `
		This is the API documentation for the [Toronto JS Community Hub](https://vms.torontojs.com/).

		Please note that the recomended way of getting data from the community hub is to use the staticly generated data available on GitHub.
		`
	}
});

// Public routes
app.route('/auth', authRoutes);
app.route('/roles', roleRoutes);
// Handle static assets using Cloudflare Workers
app.get('/assets/*', async (context: Context<EnvironmentBindings>) => context.env.ASSETS.fetch(context.req.raw));

// Public routes
app.route('/profiles', publicProfileRoutes);

// Protected routes (after auth middleware)
app.use('/*', authMiddleware);
app.route('/profiles', protectedProfileRoutes);
app.route('/teams', teamRoutes);

export default app;
