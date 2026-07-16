import { Request, Response } from 'express';
import { getAllBarber } from '../model/Barber';
import * as Service from '../model/Service';

export const getCatalog = async (req: Request, res: Response): Promise<any> => {
    try {
        const [barbers, services] = await Promise.all([
            getAllBarber(),
            Service.getAllServices()
        ]);

        res.json({ barbers, services });
    } catch (error) {
        console.error('Error fetching catalog:', error);
        res.status(500).json({ error: 'Failed to fetch catalog' });
    }
};
