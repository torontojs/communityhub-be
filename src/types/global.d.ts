interface Env {
	DB_DEV: D1Database;
}

interface EnvironmentBindings {
	Bindings: {
		database: D1Database
	};
}

type ISODate = string;
