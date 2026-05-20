const express = require('express');
const router = express.Router();
const { login } = require('../controller/authController');
const { authLimiter } = require('../middleware/rateLimiters');

// Auth endpoints
router.post('/login', authLimiter, login);

module.exports = router;
