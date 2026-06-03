const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/database');
const { buildCorsOptions } = require('./config/cors');
const barberRoutes = require('./routes/barberRoutes');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const { generalApiLimiterFallback } = require('./middleware/rateLimiters');

const app = express();
const PORT = process.env.PORT;

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(cors(buildCorsOptions()));
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use((req, res, next) => {
    if (req.method === 'GET' && (
        req.path === '/api/catalog' ||
        req.path.startsWith('/api/barbers') ||
        req.path.startsWith('/api/services')
    )) {
        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    } else if (
        req.path.startsWith('/api/availability') ||
        req.path.startsWith('/api/appointments') ||
        req.path.startsWith('/api/payments') ||
        req.path.startsWith('/api/auth')
    ) {
        res.set('Cache-Control', 'no-store');
    }

    next();
});

if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        const start = process.hrtime.bigint();
        res.on('finish', () => {
            const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
            console.log(`${req.method} ${req.path} ${res.statusCode} ${durationMs.toFixed(1)}ms`);
        });
        next();
    });
}

// Routes
app.use('/api', generalApiLimiterFallback);
app.use('/api/catalog', catalogRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Barber Booking System API is running' })
});

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
