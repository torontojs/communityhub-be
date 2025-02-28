import { DBTables, generateBaseDBfields } from '../../constants/db.ts';
import type { CreateTeamData, Team, UpdateTeamData } from './validation.ts';

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
			SET ${Object.keys(data).join(', ')}
			WHERE id = ?
		`)
		.bind(...Object.values(data), id)
		.run();

	return success;
}

export async function getTeamById(database: D1Database, id: string) {
	const { results } = await database
		.prepare(`SELECT * FROM ${DBTables.TEAM} WHERE id = ?`)
		.bind(id)
		.run<Team>();

	return results?.[0];
}

export async function getAllTeams(database: D1Database) {
	const { results } = await database.prepare(`SELECT * FROM ${DBTables.TEAM}`).run<Team>();

	return results;
}

export async function deleteTeamById(database: D1Database, id: string) {
	const { success } = await database
		.prepare(`UPDATE ${DBTables.TEAM} SET deletedAt = ? WHERE id = ?`)
		.bind(new Date().toISOString(), id)
		.run();

	return success;
}
