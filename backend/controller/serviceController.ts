import { Request, Response } from 'express';
import * as Service from '../model/Service';

export const getServices = async (req: Request, res: Response): Promise<any> => {
    try {
        const barberId = req.query.barberId as string | undefined;
        let services;

        if (barberId) {
            services = await Service.getServicesByBarber(barberId);
        } else {
            services = await Service.getAllServices();
        }

        res.json(services);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while fetching services' });
    }
};

export const getService = async (req: Request, res: Response): Promise<any> => {
    try {
        const service = await Service.getServiceById(req.params.id as string);
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json(service);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while fetching service' });
    }
};

export const addService = async (req: Request, res: Response): Promise<any> => {
    try {
        const { barber_id, name, total_price, downpayment_amount, duration_mins } = req.body;

        if (!barber_id || !name || !total_price || !downpayment_amount || !duration_mins) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }

        const newService = await Service.createService(req.body);
        res.status(201).json(newService);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while adding service' });
    }
};

export const editService = async (req: Request, res: Response): Promise<any> => {
    try {
        const updatedService = await Service.updateService(req.params.id as string, req.body);
        if (!updatedService) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json(updatedService);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while updating service' });
    }
};

export const removeService = async (req: Request, res: Response): Promise<any> => {
    try {
        const success = await Service.deleteService(req.params.id as string);
        if (!success) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json({ message: 'Service removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while removing service' });
    }
};
