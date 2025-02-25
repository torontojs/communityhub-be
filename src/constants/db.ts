import { z } from 'zod';

export const SCHEMA_VERSION = 1;

export enum DBTables {
	PROFILE = 'profile',
	TEAM = 'team',
	PASSWORD = 'passwords'
}

export const IdAndSchemaVersionSchema = z.object({
	id: z.string().uuid().describe('The entity UUID.'),
	schemaVersion: z.number().describe('The schema version that this entity is using.')
});

export type IdAndSchemaVersion = z.infer<typeof IdAndSchemaVersionSchema>;

export const InsertionTimestampsSchema = z.object({
	happenedAt: z.string().datetime({ offset: true }).describe('The date when the the event related to this entity happened.'),
	insertedAt: z.string().datetime({ offset: true }).describe('The date when the entity was added to the database.')
});

export type InsertionTimestamps = z.infer<typeof InsertionTimestampsSchema>;

export const BaseDbEntitySchema = IdAndSchemaVersionSchema.merge(InsertionTimestampsSchema);

export type BaseDBEntity = z.infer<typeof BaseDbEntitySchema>;

export const BaseDBFieldsToOmit: Record<keyof BaseDBEntity, true> = {
	id: true,
	schemaVersion: true,
	happenedAt: true,
	insertedAt: true
};

export function generateBaseDBfields() {
	const newTimestamp = new Date();

	return {
		id: crypto.randomUUID(),
		schemaVersion: SCHEMA_VERSION,
		insertedAt: newTimestamp.toISOString(),
		happenedAt: newTimestamp.toISOString()
	} satisfies BaseDBEntity;
}
