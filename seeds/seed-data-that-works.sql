INSERT INTO profile (id, email, name, description, happenedAt, insertedAt)
VALUES
('3227114d-43c4-42ed-8aea-f3860fe42222', 'profile1@example.com', 'John Doe', 'A sample profile description', '2025-01-20T10:00:00Z', '2025-01-20T10:00:00Z');

-- Unhashed password:   "password": "securePassword123#",
INSERT INTO access (id, accessLevel, password, email)
VALUES
('3227114d-43c4-42ed-8aea-f3860fe42222', 'volunteer', 'K9kBSdULvGh2IJgtYWd1Rg==:8smSRZqjjGzZew9TVZ+Te2jCPpReknjCHERzrfYGhblA/sD1TcG8qhwW7d1tppcbPm42zXihC38TLUe63kxa/A==','profile1@example.com');

UPDATE profile
SET activatedAt = CASE id
    WHEN '3227114d-43c4-42ed-8aea-f3860fe42222' THEN '2025-02-02T04:10:00Z'

END;
