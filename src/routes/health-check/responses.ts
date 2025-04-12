import { StatusResponseSchema } from 'src/utils/responses';
import { z } from 'zod';

export const HealthCheckResponseSchema = StatusResponseSchema.merge(
	z.object({
		warning: z.string().optional()
	})
);

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
