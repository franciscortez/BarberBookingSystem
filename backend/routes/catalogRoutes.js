const express = require('express');
const router = express.Router();
const { getCatalog } = require('../controller/catalogController');
const { catalogReadLimiter } = require('../middleware/rateLimiters');

router.get('/', catalogReadLimiter, getCatalog);

module.exports = router;
