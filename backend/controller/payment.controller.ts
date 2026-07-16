import { Request, Response, NextFunction } from 'express';
import * as PaymentService from '../services/payment.services';

export const handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await PaymentService.handleWebhook(req);
        res.status(200).json({ message: 'Webhook Received' });
    } catch (err) {
        next(err);
    }
};
