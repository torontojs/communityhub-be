import { DBTables, generateBaseDBfields } from '../../utils/db.ts';
import type { CreateTeamData, Team, UpdateTeamData } from './validation.ts';

export async function doesTeamExist(database: D1Database, id: string) {
	const existingTeam = await database
		.prepare(`SELECT id FROM ${DBTables.TEAM} WHERE id = ? LIMIT 1`)
		.bind(id)
		.first<{ id: string }>();

	return Boolean(existingTeam);
}

export async function insertTeam(database: D1Database, { name, description }: CreateTeamData) {
	const { id, schemaVersion, happenedAt, insertedAt } = generateBaseDBfields();

	const { success } = await database.prepare(`
		INSERT INTO ${DBTables.TEAM} (
			id, schemaVersion, happenedAt, insertedAt,
			name
			${description ? ', descrition' : ''}
		)
		VALUES (
			?, ?, ?, ?,
			?
			${description ? ', ?' : ''}
		)
	`)
		.bind(id, schemaVersion, happenedAt, insertedAt, name, description)
		.run();

	return { success, id };
}

export async function updateTeamById(database: D1Database, id: string, data: UpdateTeamData) {
	const { success } = await database
		.prepare(`
			UPDATE ${DBTables.TEAM}
			SET
				${Object.keys(data).join(', ')}
			WHERE
				id = ?
				AND deletedAt IS NULL
		`)
		.bind(...Object.values(data), id)
		.run();

	return success;
}

export async function getTeamById(database: D1Database, id: string) {
	const team = await database
		.prepare(`
			SELECT *
			FROM ${DBTables.TEAM}
			WHERE
				id = ?
				AND deletedAt IS NULL
			LIMIT 1
		`)
		.bind(id)
		.first<Team>();

	return team;
}

export async function getAllTeams(database: D1Database) {
	const { results } = await database.prepare(`
		SELECT *
		FROM ${DBTables.TEAM}
		WHERE deletedAt IS NULL
	`).run<Team>();

	return results;
}

export async function deleteTeamById(database: D1Database, id: string) {
	const now = new Date().toISOString();

	const { success } = await database
		.prepare(`
			UPDATE ${DBTables.TEAM}
			SET
				deletedAt = ?
			WHERE
				id = ?
		`)
		.bind(now, id)
		.run();

	return success;
}
