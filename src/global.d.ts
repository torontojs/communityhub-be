/* eslint-disable @typescript-eslint/consistent-type-imports */

type NodeEnvironment = import('./routes/health-check/validation.ts').NodeEnv;

interface EnvironmentBindings {
	Bindings: import('./routes/health-check/validation.ts').EnvVars & {
		Database: D1Database,
		SessionTokens: KVNamespace,
		ActivationTokens: KVNamespace,
		Assets: Fetcher
	};

	Variables: {
		session?: import('./utils/auth.ts').SessionData
	};
}

type ISODate = string;
