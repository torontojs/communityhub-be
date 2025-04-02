import { z } from 'zod';
import { BaseDbEntitySchema, BaseDBFieldsToOmit } from '../../constants/db.ts';

export const ProfileSchema = BaseDbEntitySchema.merge(z.object({
	email: z
		.string()
		.email('Invalid Email.')
		.describe('The email used for this profile, it must be unique on the database.'),
	name: z
		.string()
		.trim()
		.min(1, 'Name should be 1 or more characters long.')
		.describe('The name this person would like to be refered to.'),
	pronouns: z
		.string()
		.optional()
		.describe('Pronouns the user prescribes to'),
	birthday: z
		.string()
		.describe('Birthday of user'),
	isBasedOnGTA: z
		.number()
		.describe('User is based in GTA'),
	canJoinLocalEvents: z
		.number()
		.describe("User can participate in TorontoJS's local events"),
	avatar: z
		.string()
		.url('Invalid url.')
		.optional()
		.describe('URL source of user avatar'),
	description: z
		.string()
		.optional()
		.describe('A description for this person, may be written in markdown.'),
	links: z.array(z.string().url('Invalid url.'))
		.optional()
		.describe('A list of links for social media and platforms the person want to make available on the Community Hub.')
}));

export type Profile = z.infer<typeof ProfileSchema>;

export const CreateProfileSchema = ProfileSchema.omit(BaseDBFieldsToOmit).merge(z.object({ password: z.string() }));

export type CreateProfileRequestBody = z.infer<typeof CreateProfileSchema>;

export type CreateProfileData = z.infer<typeof CreateProfileSchema>;

export const UpdateProfileSchema = CreateProfileSchema
	.omit({ email: true, password: true })
	.partial()
	.refine(
		(data) => Object.keys(data).length === 0,
		{ message: 'At least one property is required' }
	);

export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>;
