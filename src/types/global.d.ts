type NodeEnvironment = 'development' | 'local' | 'production';

interface EnvVars {
	BASE_URL: string;
	SENDER_EMAIL: string;
	SENDGRID_API_KEY: string;
	NODE_ENV: NodeEnvironment;
}

interface EnvironmentBindings {
	Bindings: EnvVars & {
		database: D1Database,
		SESSION_TOKENS: KVNamespace,
		ACTIVATION_TOKENS: KVNamespace,
		ASSETS: Fetcher
	};
}

type ISODate = string;
