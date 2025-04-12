import { z } from 'zod';
import { BaseDbEntitySchema, BaseDBFieldsToOmit } from '../../constants/db.ts';

export const RoleSchema = BaseDbEntitySchema.merge(z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Name is required')
		.describe("The role's name."),
	description: z
		.string()
		.optional()
		.describe('A description for the role. It may include markdown content.')
}));

export type Role = z.infer<typeof RoleSchema>;

export const CreateRoleSchema = RoleSchema.omit(BaseDBFieldsToOmit);

export type CreateRoleData = z.infer<typeof CreateRoleSchema>;

export const UpdateRoleSchema = CreateRoleSchema
	.partial()
	.refine(
		(data) => Object.keys(data).length === 0,
		{ message: 'At least one property is required' }
	);

export type UpdateRoleData = z.infer<typeof UpdateRoleSchema>;
