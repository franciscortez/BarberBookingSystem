import * as BarberModel from '../model/barber.model';
import { AppError } from '../utils/AppError';
import { Barber } from '../types';
import { CreateBarberSchema, CreateBarberInput, UpdateBarberSchema, UpdateBarberInput } from '../validation/barber.validation';

export { CreateBarberSchema, CreateBarberInput, UpdateBarberSchema, UpdateBarberInput };

export const listBarbers = async (): Promise<Barber[]> => {
    return BarberModel.getAllBarber();
};

export const fetchBarber = async (id: string): Promise<Barber> => {
    const barber = await BarberModel.getBarberById(id);
    if (!barber) throw AppError.notFound('Barber not found');
    return barber;
};

export const createBarber = async (data: CreateBarberInput): Promise<Barber> => {
    return BarberModel.createBarber(data.name);
};

export const updateBarber = async (id: string, data: UpdateBarberInput): Promise<Barber> => {
    const updated = await BarberModel.updateBarber(id, data.name);
    if (!updated) throw AppError.notFound('Barber not found');
    return updated;
};


export const deleteBarber = async (id: string): Promise<void> => {
    const success = await BarberModel.deleteBarber(id);
    if (!success) throw AppError.notFound('Barber not found');
};
