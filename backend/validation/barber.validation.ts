import { z } from 'zod';

export const CreateBarberSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100)
});

export const UpdateBarberSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100)
});
