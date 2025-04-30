declare module 'cloudflare:test' {
	interface Env {
		Database: D1Database;
		SessionTokens: KVNamespace;
		ActivationTokens: KVNamespace;
	}

	export const env: Env;
}
