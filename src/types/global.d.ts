interface EnvironmentBindings {
	Bindings: {
		database: D1Database,
		SESSION_TOKENS: KVNamespace,
		ACTIVATION_TOKENS: KVNamespace,
		SENDGRID_API_KEY: string
	};
}

type ISODate = string;
