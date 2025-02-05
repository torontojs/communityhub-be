import { DBTables } from '../constants/db.ts';

export async function validateProfileId({
	id,
	database
}: {
	id: string,
	database: D1Database
}): Promise<boolean> {
	try {
		const { results } = await database
			.prepare(`SELECT id FROM ${DBTables.PROFILE} WHERE id = ?`)
			.bind(id)
			.run();

		return Boolean(results.length);
	} catch (error) {
		console.log(error);
		return false;
	}
}
