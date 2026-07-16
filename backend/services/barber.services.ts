import { z } from 'zod';
import * as BarberModel from '../model/barber.model';
import { AppError } from '../utils/AppError';
import { Barber } from '../types';
import { CreateBarberSchema, UpdateBarberSchema } from '../validation/barber.validation';

export { CreateBarberSchema, UpdateBarberSchema };

export const listBarbers = async (): Promise<Barber[]> => {
    return BarberModel.getAllBarber();
};

export const fetchBarber = async (id: string): Promise<Barber> => {
    const barber = await BarberModel.getBarberById(id);
    if (!barber) throw AppError.notFound('Barber not found');
    return barber;
};

export const createBarber = async (data: z.infer<typeof CreateBarberSchema>): Promise<Barber> => {
    return BarberModel.createBarber(data.name);
};

export const updateBarber = async (id: string, data: z.infer<typeof UpdateBarberSchema>): Promise<Barber> => {
    const updated = await BarberModel.updateBarber(id, data.name);
    if (!updated) throw AppError.notFound('Barber not found');
    return updated;
};

export const deleteBarber = async (id: string): Promise<void> => {
    const success = await BarberModel.deleteBarber(id);
    if (!success) throw AppError.notFound('Barber not found');
};
