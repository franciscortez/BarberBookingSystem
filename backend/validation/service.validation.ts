import { z } from 'zod';

// Accepts number or numeric-string, coerces to 2-decimal string for DB compatibility
const decimalField = (label: string) =>
    z.union([
        z.number({ message: `${label} must be a number` }).positive(`${label} must be positive`),
        z.string().regex(/^\d+(\.\d{1,2})?$/, `${label} must be a valid decimal number`)
    ]).transform(v => String(v));

export const CreateServiceSchema = z.object({
    barber_id: z.string().uuid('barber_id must be a valid UUID'),
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().max(1000).optional(),
    total_price: decimalField('total_price'),
    downpayment_amount: decimalField('downpayment_amount'),
    duration_mins: z
        .union([
            z.number({ message: 'duration_mins must be a number' }).int().positive(),
            z.string().regex(/^\d+$/).transform(Number)
        ])
}).refine(
    data => parseFloat(data.downpayment_amount) <= parseFloat(data.total_price),
    { message: 'downpayment_amount must not exceed total_price', path: ['downpayment_amount'] }
);

export const UpdateServiceSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    total_price: decimalField('total_price').optional(),
    downpayment_amount: decimalField('downpayment_amount').optional(),
    duration_mins: z
        .union([
            z.number().int().positive(),
            z.string().regex(/^\d+$/).transform(Number)
        ])
        .optional()
});
