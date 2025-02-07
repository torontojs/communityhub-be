interface EnvironmentBindings {
	Bindings: {
		database: D1Database,
		kv: KVNamespace,
		SENDGRID_API_KEY: string
	};
}

type ISODate = string;
