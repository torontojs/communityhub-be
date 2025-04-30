import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'miniflare',
		globals: true,
		include: ['src/**/*.test.ts'],
		environmentOptions: {
			kvNamespaces: ['SESSION_TOKENS', 'ACTIVATION_TOKENS'],
			d1Databases: {
				database: { path: './test-d1.sqlite' }
			},
			vars: {
				NODE_ENV: 'local',
				NODE_VERSION: '22.12.0',
				BASE_URL: 'http://localhost:8787'
			}
		}
	}
});
