import { z } from 'zod';

export const AvailabilityQuerySchema = z.object({
    barberId: z.string().uuid('barberId must be a valid UUID'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
    serviceId: z.string().uuid('serviceId must be a valid UUID').optional()
});
