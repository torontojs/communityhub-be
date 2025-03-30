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
	slack: z
		.string()
		.trim()
		.min(1, 'Slack handle should be 1 or more characters long.')
		.describe('The slack handle used by this person'),
	pronouns: z
		.string()
		.optional()
		.describe('Pronouns the user prescribes to'),
	// Discussion: Change Birthday to ISO Date Object ?
	birthday: z
		.string()
		.describe('Birthday of user'),
	isBasedOnGTA: z
		.number()
		.describe('User is based in GTA'),
	canJoinLocalEvents: z
		.number()
		.describe("User can participate in TorontoJS's local events"),
	// Discussion: Optional Avatar Upload?
	avatar: z
		.string()
		.optional()
		.describe('File Name of user avatar'),
	avatarSource: z
		.string()
		.optional()
		.describe('URL or local upload link of user avatar'),
	description: z
		.string()
		.optional()
		.describe('A description for this person, may be written in markdown.'),
	// Discussion: Should LinkedIn, Github, and Site/Portfolio be mandatory links?
	links: z.array(z.string().url('Invalid url.'))
		.optional()
		.describe('A list of links for social media and platforms the person want to make available on the VMS.'),
	skills: z.array(z.string())
		.optional()
		.describe('A list of skills for this user')
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
