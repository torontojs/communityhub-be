-- Migration number: 0005 	 2025-01-30T00:58:45.123Z

DROP TABLE IF EXISTS password;

-- Store authentication and authorization data separately from profiles
CREATE TABLE IF NOT EXISTS password (
	-- The UUID, stored as text
	id TEXT NOT NULL UNIQUE COLLATE BINARY,
	-- Schema version to use
	schemaVersion INTEGER NOT NULL DEFAULT 1,
	-- The person's account password (hashed)
	password TEXT NOT NULL,
	-- The date the role password was created
	happenedAt DATETIME NOT NULL,
	-- The date this access was added to the database
	insertedAt DATETIME NOT NULL,

	PRIMARY KEY (id),
	FOREIGN KEY (id) REFERENCES profile(id)
);
