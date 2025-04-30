import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				wrangler: {
					configPath: './wrangler.toml'
				},
				miniflare: {
					d1Persist: './.wrangler/state/d1',
					kvPersist: './.wrangler/state/kv'
				}
			}
		}
	}
});
