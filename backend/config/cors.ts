import dotenv from 'dotenv';
dotenv.config();

const normalizeOrigin = (origin: string): string => {
    try {
        return new URL(origin).origin;
    } catch {
        return origin ? origin.replace(/\/+$/, '') : '';
    }
};

export const getAllowedOrigins = (): string[] => {
    const configuredOrigins = process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || '';

    return configuredOrigins
        .split(',')
        .map(origin => normalizeOrigin(origin.trim()))
        .filter(Boolean);
};

export const buildCorsOptions = () => ({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        const allowedOrigins = getAllowedOrigins();
        return callback(null, allowedOrigins.includes(normalizeOrigin(origin)));
    },
    credentials: true
});
