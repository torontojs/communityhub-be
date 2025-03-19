import { DBTables, generateBaseDBfields } from '../../constants/db.ts';
import type { CreateRoleData, Role, UpdateRoleData } from './validation.ts';

export async function insertRole(database: D1Database, { name, description }: CreateRoleData) {
	const { id, schemaVersion, happenedAt, insertedAt } = generateBaseDBfields();

	const { success } = await database.prepare(`
		INSERT INTO ${DBTables.ROLE} (
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

export async function updateRoleById(database: D1Database, id: string, data: UpdateRoleData) {
	const { success } = await database
		.prepare(`
			UPDATE ${DBTables.ROLE}
			SET ${Object.keys(data).join(', ')}
			WHERE id = ?
		`)
		.bind(...Object.values(data), id)
		.run();

	return success;
}

export async function getRoleById(database: D1Database, id: string) {
	const { results } = await database
		.prepare(`SELECT * FROM ${DBTables.ROLE} WHERE id = ?`)
		.bind(id)
		.run<Role>();

	return results?.[0];
}

export async function getAllRoles(database: D1Database) {
	const { results } = await database.prepare(`SELECT * FROM ${DBTables.ROLE}`).run<Role>();

	return results;
}

export async function deleteRoleById(database: D1Database, id: string) {
	const { success } = await database
		.prepare(`UPDATE ${DBTables.ROLE} SET deletedAt = ? WHERE id = ?`)
		.bind(new Date().toISOString(), id)
		.run();

	return success;
}
