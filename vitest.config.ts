import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				wrangler: {
					configPath: './wrangler.toml' // Automatically reads your bindings
				},
				miniflare: {
					d1Persist: true, // Optional persistence
					kvPersist: true // Optional persistence
				}
			}
		}
	}
});
