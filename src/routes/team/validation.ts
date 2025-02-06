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

export const CreateTeamSchema = TeamSchema.omit(BaseDBFieldsToOmit);

export type CreateTeamData = z.infer<typeof CreateTeamSchema>;

export const UpdateTeamSchema = CreateTeamSchema

export type UpdateTeamData = z.infer<typeof UpdateTeamSchema>;
