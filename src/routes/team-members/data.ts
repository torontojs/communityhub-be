import { DBTables, generateBaseDBfields } from '../../utils/db.ts';
import type { Profile } from '../profile/validation.ts';
import type { AddTeamMembers, UpdateTeamMembers } from './validation.ts';

export async function addTeamMembers(database: D1Database, teamId: string, data: AddTeamMembers) {
	const results = await database.batch([
		...data.map(({ name, profileId, description }) => {
			const { id, schemaVersion, happenedAt, insertedAt } = generateBaseDBfields();

			return database.prepare(`
				INSERT INTO ${DBTables.ROLE} (
					id, schemaVersion, happenedAt, insertedAt,
					name, profileId, teamId,
					${description ? ', descrition' : ''}
				)
				VALUES (
					?, ?, ?, ?,
					?, ?, ?
					${description ? ', ?' : ''}
				)
			`).bind(
				id,
				schemaVersion,
				happenedAt,
				insertedAt,
				name,
				profileId,
				teamId,
				description
			);
		})
	]);

	return results.every(({ success }) => success);
}

export async function updateTeamMembers(database: D1Database, teamId: string, data: UpdateTeamMembers) {
	const results = await database.batch([
		...data.map(({ id, description, name }) =>
			database.prepare(`
				UPDATE ${DBTables.ROLE}
				SET
					name = ?,
					description = ?
				WHERE
					id = ?
					AND teamId = ?
			`).bind(name ?? '', description ?? '', id, teamId)
		)
	]);

	return results.every(({ success }) => success);
}

export async function getAllMembers(database: D1Database, teamId: string) {
	const { results } = await database.prepare(`
		SELECT
			${DBTables.PROFILE}.id AS id,
			${DBTables.PROFILE}.name AS name,
			${DBTables.PROFILE}.avatar AS avatar
		FROM ${DBTables.ROLE}
		INNER JOIN
			${DBTables.PROFILE}
			ON
				${DBTables.PROFILE}.id = ${DBTables.ROLE}.id
				AND ${DBTables.PROFILE}.activatedAt IS NOT NULL
				AND ${DBTables.PROFILE}.deletedAt IS NULL
		WHERE
			${DBTables.ROLE}.teamId = ?
	`).bind(teamId).run<Pick<Profile, 'avatar' | 'id' | 'name'>>();

	return results;
}

export async function deleteTeamMembers(database: D1Database, teamId: string, data: string[]) {
	const results = await database.batch(
		data.map((id) =>
			database
				.prepare(`
					UPDATE ${DBTables.ROLE}
					SET
						deletedAt = ?
					WHERE
						id = ?
						AND teamId = ?
				`).bind(new Date().toISOString(), id, teamId)
		)
	);

	return results.every(({ success }) => success);
}
