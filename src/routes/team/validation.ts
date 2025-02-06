import { z } from 'zod';
import { BaseDbEntitySchema, BaseDBFieldsToOmit } from '../../constants/db.ts';

export const TeamSchema = BaseDbEntitySchema.merge(z.object({
	name: z
		.string()
		.min(1, 'Name is required')
		.describe("The team's name."),
	description: z
		.string()
		.optional()
		.describe('A description for the team. It may include markdown content.')
})).required();

export type Team = z.infer<typeof TeamSchema>;

export const NewTeamSchema = TeamSchema.omit(BaseDBFieldsToOmit);

export type NewTeamData = z.infer<typeof NewTeamSchema>;

export const UpdateTeamSchema = NewTeamSchema.partial();

export type UpdateTeamData = z.infer<typeof UpdateTeamSchema>;
