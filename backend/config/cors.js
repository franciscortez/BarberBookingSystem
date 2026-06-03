const normalizeOrigin = (origin) => {
    try {
        return new URL(origin).origin;
    } catch {
        return origin ? origin.replace(/\/+$/, '') : '';
    }
};

const getAllowedOrigins = () => {
    const configuredOrigins = process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || '';

    return configuredOrigins
        .split(',')
        .map(origin => normalizeOrigin(origin.trim()))
        .filter(Boolean);
};

const buildCorsOptions = () => ({
    origin: (origin, callback) => {
        if (!origin || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        const allowedOrigins = getAllowedOrigins();
        return callback(null, allowedOrigins.includes(normalizeOrigin(origin)));
    }
});

module.exports = {
    buildCorsOptions,
    getAllowedOrigins
};
