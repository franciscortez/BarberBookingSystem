const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');

// POST /api/payments/webhook
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
