const express = require('express');
const router = express.Router();
const { getAvailability } = require('../controller/availabilityController');
const { availabilityLimiter } = require('../middleware/rateLimiters');

// Public availability endpoint
router.get('/', availabilityLimiter, getAvailability);

module.exports = router;
