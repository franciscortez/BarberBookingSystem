import { Request, Response, NextFunction } from 'express';
import * as BarberService from '../services/barber.services';

export const getBarbers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const barbers = await BarberService.listBarbers();
        res.status(200).json(barbers);
    } catch (err) {
        next(err);
    }
};

export const getBarber = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const barber = await BarberService.fetchBarber(req.params.id as string);
        res.status(200).json(barber);
    } catch (err) {
        next(err);
    }
};

export const addBarber = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = BarberService.CreateBarberSchema.parse(req.body);
        const barber = await BarberService.createBarber(data);
        res.status(201).json(barber);
    } catch (err) {
        next(err);
    }
};

export const editBarber = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = BarberService.UpdateBarberSchema.parse(req.body);
        const barber = await BarberService.updateBarber(req.params.id as string, data);
        res.status(200).json(barber);
    } catch (err) {
        next(err);
    }
};

export const removeBarber = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await BarberService.deleteBarber(req.params.id as string);
        res.status(200).json({ message: 'Barber deleted successfully' });
    } catch (err) {
        next(err);
    }
};
