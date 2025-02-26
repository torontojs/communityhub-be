import { z } from 'zod';

export const SCHEMA_VERSION = 1;

export enum DBTables {
	PROFILE = 'profile',
	TEAM = 'team',
	PASSWORD = 'passwords',
	ROLE = 'role'
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

export const DeletionTimestampsSchema = z.object({
	deletedAt: z.string().datetime({ offset: true }).describe('The date when the entity was deleted from the database.').optional()
});

export type DeletionTimestamps = z.infer<typeof DeletionTimestampsSchema>;

export const TimestampsSchema = InsertionTimestampsSchema.merge(DeletionTimestampsSchema);

export type Timestamps = z.infer<typeof TimestampsSchema>;


export const BaseDbEntitySchema = IdAndSchemaVersionSchema.merge(TimestampsSchema);

export type BaseDBEntity = z.infer<typeof BaseDbEntitySchema>;

export const BaseDBFieldsToOmit: Record<keyof BaseDBEntity, true> = {
	id: true,
	schemaVersion: true,
	happenedAt: true,
	insertedAt: true,
	deletedAt: true
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
