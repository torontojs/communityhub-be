interface EnvVars {
	database: D1Database;
	SESSION_TOKENS: KVNamespace;
	ACTIVATION_TOKENS: KVNamespace;
	BASE_URL: string;
	SENDER_EMAIL: string;
	SENDGRID_API_KEY: string;
	ASSETS: Fetcher;
}

interface EnvironmentBindings {
	Bindings: EnvVars;
}

type ISODate = string;
