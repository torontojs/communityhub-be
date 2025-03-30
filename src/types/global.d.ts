type NodeEnvironment = 'local' | 'development' | 'production';

interface EnvironmentBindings {
	Bindings: {
		database: D1Database,
		SESSION_TOKENS: KVNamespace,
		ACTIVATION_TOKENS: KVNamespace,
		BASE_URL: string,
		SENDER_EMAIL: string,
		SENDGRID_API_KEY: string,
		ASSETS: Fetcher,
		NODE_ENV: NodeEnvironment
	};
}

type ISODate = string;
