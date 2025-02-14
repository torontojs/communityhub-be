interface EnvironmentBindings {
	Bindings: {
		database: D1Database,
		SESSION_TOKENS: KVNamespace,
		ACTIVATION_TOKENS: KVNamespace,
		BASE_URL: string,
		SENDER_EMAIL: string,
		SENDGRID_API_KEY: string
	};
}

type ISODate = string;
