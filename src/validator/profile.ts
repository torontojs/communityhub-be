export async function validateProfileId({
	id,
	database
}: {
	id: string,
	database: D1Database
}): Promise<boolean> {
	try {
		const { results } = await database
			.prepare('SELECT profile.id FROM profile WHERE id = ?')
			.bind(id)
			.run();

		return Boolean(results.length);
	} catch (error) {
		console.log(error);
		return false;
	}
}
