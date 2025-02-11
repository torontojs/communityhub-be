-- Migration number: 0002 	 2025-01-30T00:58:21.685Z

DROP TABLE IF EXISTS profile;

-- A person's profile inside the database
-- It should contain no sensitive information
CREATE TABLE IF NOT EXISTS profile (
	-- The UUID, stored as text
	id TEXT NOT NULL UNIQUE COLLATE BINARY,
	-- The person's email,
	-- It is used as a reference for the user
	-- And should be unique inside the system
	email TEXT NOT NULL UNIQUE,
	-- Schema version to use
	schemaVersion INTEGER NOT NULL DEFAULT 1,
	-- The person's name, or how they like to be identified
	name TEXT NOT NULL,
	-- A text blurb the person can provide about themselves
	description TEXT,
	-- A flag indicating if the user is based on the Grater Toronto Area (GTA)
	isBasedOnGTA INTEGER NOT NULL DEFAULT 1 CHECK(isBasedOnGTA IN (0, 1)),
	-- A flag indicating if the user is available to join local/in-person events
	canJoinLocalEvents INTEGER NOT NULL DEFAULT 1 CHECK(canJoinLocalEvents IN (0, 1)),
	-- The pronouns the person identifies with
	pronouns TEXT,
	-- The person's birthday, saved as month and day only
	-- In the format: MM-DD
	birthday TEXT,
	-- The user avatar reference,
	avatar TEXT,
	-- The avatar may be a url, or an id for a file hosted on the platform
	avatarSource TEXT DEFAULT 'id' CHECK(avatarSource IS NULL OR avatarSource IN ('id', 'url')),
	-- The date this person has joined Toronto JS
	happenedAt TEXT NOT NULL,
	-- The date this profile was added to the database
	insertedAt TEXT NOT NULL,

	PRIMARY KEY (id)
);

DROP TABLE IF EXISTS profile_links;

CREATE TABLE IF NOT EXISTS profile_links (
	-- The UUID of the link, stored as text
	id TEXT NOT NULL UNIQUE COLLATE BINARY,
	-- The UUID of the profile this link belongs to
	profile_id TEXT NOT NULL,
	-- The URL of the link
	url TEXT NOT NULL,

	PRIMARY KEY (id),
	FOREIGN KEY (profile_id) REFERENCES profile(id)
);

DROP TABLE IF EXISTS profile_skills;

CREATE TABLE IF NOT EXISTS profile_skills (
	-- The UUID of the skill, stored as text
	id TEXT NOT NULL UNIQUE COLLATE BINARY,
	-- The UUID of the profile this skill belongs to
	profile_id TEXT NOT NULL,
	-- The name of the skill
	skill_name TEXT NOT NULL,

	PRIMARY KEY (id),
	FOREIGN KEY (profile_id) REFERENCES profile(id)
);
