-- Volunteer Profile Schema
CREATE TABLE IF NOT EXISTS profile (
    id TEXT PRIMARY KEY NOT NULL UNIQUE COLLATE BINARY,               -- UUID stored as TEXT
    email TEXT NOT NULL UNIQUE,
    schemaVersion INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    happenedAt DATETIME NOT NULL,
    insertedAt DATETIME NOT NULL,
    links TEXT                                                          -- Store markup for social links
);
