import { DBTables, generateBaseDBfields } from '../../constants/db.ts';
import type { CreateRoleData, Role, UpdateRoleData } from './validation.ts';

export async function insertRole(database: D1Database, data: CreateRoleData) {
	const baseDbfields = generateBaseDBfields();

	const { success } = await database.prepare(`
		INSERT INTO ${DBTables.ROLE} (
			${Object.keys(baseDbfields).join(', ')},
			${Object.keys(data).join(', ')}
		)
		VALUES (
			${[...Object.keys(baseDbfields)].fill('?').join(', ')},
			${[...Object.keys(data)].fill('?').join(', ')}
		)
	`)
		.bind(...Object.values(baseDbfields), ...Object.values(data))
		.run();

	return { success, id: baseDbfields.id };
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
