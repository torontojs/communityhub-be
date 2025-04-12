/* eslint-disable @typescript-eslint/consistent-type-imports */

type NodeEnvironment = import('../routes/health-check/validation.ts').NodeEnv;

interface EnvironmentBindings {
	Bindings: import('../routes/health-check/validation.ts').EnvVars & {
		database: D1Database,
		SESSION_TOKENS: KVNamespace,
		ACTIVATION_TOKENS: KVNamespace,
		ASSETS: Fetcher
	};

	Variables: {
		session: import('../utils/auth.ts').SessionData
	};
}

type ISODate = string;
