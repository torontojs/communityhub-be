import { z } from 'zod';

export const HeartbeatResponseSchema = z.object({
	access: z.string()
		.describe('Acces level.'),
	name: z.string()
		.describe('Name of the user.'),
	avatar: z.string()
		.describe('URL where avatar located.')
}).describe('Response for an operation status, it does not include data, only a message and potential validation errors.');

export type HeartbeatResponse = z.infer<typeof HeartbeatResponseSchema>;
