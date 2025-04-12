import type { Context, Next } from 'hono';

export type AuthMiddleware = (context: Context, next: Next) => Promise<void>;
