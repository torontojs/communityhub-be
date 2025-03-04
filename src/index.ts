import { OpenAPIHono } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { cors } from 'hono/cors';
import packageJson from '../package.json';
import { authMiddleware } from './middleware/auth.ts';
import { authorizationVolunteer } from './middleware/createMiddleware.ts';
import { authRoutes } from './routes/auth/index.ts';
import { profileRoutes } from './routes/profile/index.ts';
import { teamRoutes } from './routes/team/index.ts';
import type { Session } from './types/data/session.d.ts';
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
// Handle static assets using Cloudflare Workers
app.get('/assets/*', async (context: Context<EnvironmentBindings>) => context.env.ASSETS.fetch(context.req.raw));

// Protected routes - note hierarchy of access
app.use(authMiddleware);

// Volunteer routes(everyone can access)
app
	.get('/profile', authorizationVolunteer, async (c) => profileRoutes.fetch(c.req.raw))
	.get('/profile/:id', authorizationVolunteer, async (c) => profileRoutes.fetch(c.req.raw))
	.patch('/profile/:id', authorizationVolunteer, async (c: Context) => {
		const session = c.get('session') as Session;
		const requestedId = c.req.param('id');

		// Check if the requested ID matches the session ID
		if (requestedId !== session.id) {
			return c.json({ message: 'Forbidden: Can only update own profile' }, StatusCodes.FORBIDDEN);
		}

		return profileRoutes.fetch(c.req.raw);
	})
	.get('/team', authorizationVolunteer, async (c) => teamRoutes.fetch(c.req.raw))
	.get('/team/:id', authorizationVolunteer, async (c) => teamRoutes.fetch(c.req.raw));

// Routes for testing will be removed before deployment
app.route('/profiles', profileRoutes);
app.route('/teams', teamRoutes);

export default app;
