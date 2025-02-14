import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth/index.ts';
import { profileRoutes } from './routes/profile/index.ts';
import { teamRoutes } from './routes/team/index.ts';

const app = new Hono();

app.get('/', (context) => context.text('Welome to volunteer management system!'));

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

app.route('/profiles', profileRoutes);
app.route('/teams', teamRoutes);
app.route('/auth', authRoutes);

export default app;
