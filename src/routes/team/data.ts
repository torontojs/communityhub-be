import { DBTables, SCHEMA_VERSION } from '../../constants/db.ts';
import type { NewTeamData, Team, UpdateTeamData } from './validation.ts';

export async function createNewTeam(database: D1Database, body: NewTeamData) {
	const id = crypto.randomUUID();
	const insertedAt = new Date().toISOString();
	const happenedAt = new Date(body.happenedAt).toISOString();

	const { success } = await database.prepare(
		`INSERT INTO ${DBTables.TEAM} (id, name, schemaVersion, description, happenedAt, insertedAt) VALUES (?,?,?,?,?,?)`
	)
		.bind(id, body.name, SCHEMA_VERSION, body.description ?? '', happenedAt, insertedAt)
		.run();

	return success;
}

export async function updateTeamById(database: D1Database, teamId: string, body: UpdateTeamData) {
	if (Object.keys(body).length === 0) {
		throw new Error('No fields provided to update');
	}

	const { success } = await database
		.prepare(`UPDATE ${DBTables.TEAM} SET ${Object.keys(body).join(', ')} WHERE id = ?`)
		.bind(...Object.values(body), teamId)
		.run();

	return success;
}

export async function getAllTeams(database: D1Database) {
	const { results } = await database.prepare(`SELECT * FROM ${DBTables.TEAM}`).run<Team>();

	return results;
}

export async function getTeamById(database: D1Database, id: string) {
	const { results } = await database
		.prepare(`SELECT * FROM ${DBTables.TEAM} WHERE id = ?`)
		.bind(id)
		.run<Team>();

	return results?.[0];
}

export async function deleteTeamById(database: D1Database, teamId: string) {
	const { success } = await database
		.prepare(`DELETE FROM ${DBTables.TEAM} WHERE id = ?`)
		.bind(teamId)
		.run();

	return success;
}
