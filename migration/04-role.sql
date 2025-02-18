-- Role Schema
CREATE TABLE IF NOT EXISTS role (
    id TEXT PRIMARY KEY NOT NULL UNIQUE COLLATE BINARY,               -- UUID stored as TEXT
    schemaVersion INTEGER NOT NULL,
    role TEXT NOT NULL,
    description TEXT,
    teamId TEXT NOT NULL UNIQUE COLLATE BINARY,              -- UUID stored as TEXT
    profileId TEXT NOT NULL UNIQUE COLLATE BINARY,           -- UUID stored as TEXT
    happenedAt DATETIME NOT NULL,
    insertedAt DATETIME NOT NULL,
    FOREIGN KEY (teamId) REFERENCES team(id),
    FOREIGN KEY (profileId) REFERENCES profile(id)
);
