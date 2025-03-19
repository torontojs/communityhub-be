import { z } from 'zod';

export interface Profile {
	id: string;
	email: string;
	schemaVersion: number;
	password: string;
	name: string;
	description?: string;
	happenedAt: ISODate;
	insertedAt: ISODate;
	links?: string;
}

export const SignInSchema = z.object({
	email: z
		.string({ required_error: 'Email is required' })
		.min(1, 'Email must be at least one character long')
		.email('Invalid Email'),
	password: z
		.string()
		.min(1, 'Password must be at least one character long')
});

export type SignInData = z.infer<typeof SignInSchema>;
