import { z } from 'zod';

export const CreateBarberSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100)
});

export type CreateBarberInput = z.infer<typeof CreateBarberSchema>;

export const UpdateBarberSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100)
});

export type UpdateBarberInput = z.infer<typeof UpdateBarberSchema>;

