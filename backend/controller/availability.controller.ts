import { Request, Response, NextFunction } from 'express';
import * as AvailabilityService from '../services/availability.services';

export const getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const query = AvailabilityService.AvailabilityQuerySchema.parse({
            barberId: req.query.barberId,
            date: req.query.date,
            serviceId: req.query.serviceId
        });
        const result = await AvailabilityService.getAvailability(query);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
