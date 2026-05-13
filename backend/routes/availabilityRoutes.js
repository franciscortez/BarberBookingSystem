const express = require('express');
const router = express.Router();
const { getAvailability } = require('../controller/availabilityController');

// Public availability endpoint
router.get('/', getAvailability);

module.exports = router;
