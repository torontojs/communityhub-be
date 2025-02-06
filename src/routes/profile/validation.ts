import { z } from 'zod';
import { BaseDbEntitySchema, BaseDBFieldsToOmit } from '../../constants/db.ts';

export const ProfileSchema = BaseDbEntitySchema.merge(z.object({
	email: z
		.string()
		.email('Invalid Email.')
		.describe('The email used for this profile, it must be unique on the database.'),
	name: z
		.string()
		.min(1, 'Name should be 1 or more characters long.')
		.describe('The name this person would like to be refered to.'),
	description: z
		.string()
		.optional()
		.describe('A description for this person, may be written in markdown.'),
	links: z.array(z.string().url('Invalid url.'))
		.optional()
		.describe('A list of links for social media and platforms the person want to make available on the VMS.')
}));

export type Profile = z.infer<typeof ProfileSchema>;

export const CreateProfileSchema = ProfileSchema.omit(BaseDBFieldsToOmit);

export type CreateProfileData = z.infer<typeof CreateProfileSchema>;

export const UpdateProfileSchema = CreateProfileSchema
	.omit({ email: true })
	.partial();

export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>;
