INSERT INTO profile (id, email, name, description, happenedAt, insertedAt)
VALUES
('3227114d-43c4-42ed-8aea-f3860fe42222', 'profile1@example.com', 'John Doe', 'A sample profile description', '2025-01-20T10:00:00Z', '2025-01-20T10:00:00Z'),
('aa7e8915-8034-43d9-b910-a2e3ebdb947f', 'profile2@example.com', 'Jane Smith', 'Another sample profile description', '2025-01-20T11:00:00Z', '2025-01-20T11:00:00Z');

INSERT INTO team (id, name, description, happenedAt, insertedAt)
VALUES
('9a633d13-8095-48a8-9bf1-08ea40f5faa0', 'Team A', 'This is team A', '2025-01-20T10:00:00Z', '2025-01-20T10:00:00Z'),
('fc596eaf-896d-4247-a880-92ec5019d4bd', 'Team B', 'This is team B', '2025-01-20T11:00:00Z', '2025-01-20T11:00:00Z');

INSERT INTO role (id, role, description, teamId, profileId, happenedAt, insertedAt)
VALUES
('3ad040f0-2d52-43d1-a1d7-54d9560453d5', 'Developer', 'A software developer role', '9a633d13-8095-48a8-9bf1-08ea40f5faa0', '3227114d-43c4-42ed-8aea-f3860fe42222', '2025-01-20T10:00:00Z', '2025-01-20T10:00:00Z'),
('ad7a750e-1417-4b89-88f6-2e76464eed30', 'Manager', 'A team manager role', 'fc596eaf-896d-4247-a880-92ec5019d4bd', 'aa7e8915-8034-43d9-b910-a2e3ebdb947f', '2025-01-20T11:00:00Z', '2025-01-20T11:00:00Z');

INSERT INTO event_log (id, subject, subjectSource, verb, object, objectSource, happenedAt, insertedAt)
VALUES
('eda2a43f-ef85-4de6-a6dc-7cee0d9d4af7', '3227114d-43c4-42ed-8aea-f3860fe42222', 'profile', 'created', '9a633d13-8095-48a8-9bf1-08ea40f5faa0', 'team', '2025-01-20T10:00:00Z', '2025-01-20T10:00:00Z'),
('0c27ba8d-d5b8-4dad-ae0f-70cfda5429a0', 'aa7e8915-8034-43d9-b910-a2e3ebdb947f', 'profile', 'assigned', '3ad040f0-2d52-43d1-a1d7-54d9560453d5', 'role', '2025-01-20T11:00:00Z', '2025-01-20T11:00:00Z');
