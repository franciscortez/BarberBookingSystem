import { Request, Response, NextFunction } from 'express';
import * as ServiceService from '../services/service.services';

export const getServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const barberId = req.query.barberId as string | undefined;
        const services = await ServiceService.listServices(barberId);
        res.json(services);
    } catch (err) {
        next(err);
    }
};

export const getService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const service = await ServiceService.fetchService(req.params.id as string);
        res.json(service);
    } catch (err) {
        next(err);
    }
};

export const addService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = ServiceService.CreateServiceSchema.parse(req.body);
        const service = await ServiceService.createService(data);
        res.status(201).json(service);
    } catch (err) {
        next(err);
    }
};

export const editService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = ServiceService.UpdateServiceSchema.parse(req.body);
        const service = await ServiceService.updateService(req.params.id as string, data);
        res.json(service);
    } catch (err) {
        next(err);
    }
};

export const removeService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await ServiceService.deleteService(req.params.id as string);
        res.json({ message: 'Service removed successfully' });
    } catch (err) {
        next(err);
    }
};
