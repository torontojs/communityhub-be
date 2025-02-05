import { z } from 'zod';

export interface Profile {
	id: string;
	email: string;
	schemaVersion: number;
	name: string;
	description?: string;
	happenedAt: ISODate;
	insertedAt: ISODate;
	links?: string;
}

export const CreateProfileSchema = z.object({
	email: z
		.string({ required_error: 'Email is required' })
		.email('Invalid Email'),
	name: z
		.string({ required_error: 'Name is required' })
		.min(1, 'Name should be 1 or more characters long'),
	description: z.string().optional(),
	links: z.string().url('Invalid url').optional()
});

export type CreateProfileRequestBody = z.infer<typeof CreateProfileSchema>;

export const UpdateProfileSchema = z.object({
	name: z
		.string()
		.min(1, 'Name should be 1 or more characters long')
		.optional(),
	happenedAt: z
		.string({ required_error: 'HappenedAt is required' })
		.datetime('HappenedAt should be ISO date string format'),
	description: z.string().optional(),
	links: z.string().url('Invalid url').optional()
});

export type UpdateProfileRequestBody = z.infer<typeof UpdateProfileSchema>;
