-- Event Log Schema
CREATE TABLE IF NOT EXISTS event_log (
    id TEXT PRIMARY KEY NOT NULL UNIQUE COLLATE BINARY,               -- UUID stored as TEXT
    schemaVersion INTEGER NOT NULL,
    subject TEXT NOT NULL UNIQUE COLLATE BINARY,             -- UUID stored as TEXT (could be user or entity performing the action)
    subjectSource TEXT NOT NULL DEFAULT 'profile' CHECK("subjectSource" IN ('profile', 'team', 'role', 'special'))
    verb TEXT NOT NULL,                -- Action (e.g., 'join', 'leave', 'assigned to')
    object TEXT NOT NULL UNIQUE COLLATE BINARY,              -- UUID stored as TEXT (the affected entity, e.g., profile, team)
    objectSource TEXT NOT NULL DEFAULT 'special' CHECK("objectSource" IN ('profile', 'team', 'role', 'special'))
    happenedAt DATETIME NOT NULL,          -- The time the event occurred
    insertedAt DATETIME NOT NULL,          -- When the event log was inserted
);
