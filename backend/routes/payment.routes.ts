import { Router } from 'express';
import * as paymentController from '../controller/payment.controller';

const router = Router();

// POST /api/payments/webhook
router.post('/webhook', paymentController.handleWebhook);

export = router;
