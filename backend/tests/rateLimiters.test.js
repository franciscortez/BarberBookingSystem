const express = require('express');
const request = require('supertest');
const {
    createRateLimiter,
    generalApiLimiterFallback
} = require('../middleware/rateLimiters');

describe('Rate limiting middleware', () => {
    const buildLimitedApp = (limit = 2) => {
        const app = express();
        app.use(createRateLimiter({
            windowMs: 60 * 1000,
            limit,
            message: 'Test retry message.'
        }));
        app.get('/limited', (req, res) => res.json({ ok: true }));
        return app;
    };

    it('returns 429 JSON after the configured request limit is exceeded', async () => {
        const app = buildLimitedApp(2);

        await request(app).get('/limited').expect(200);
        await request(app).get('/limited').expect(200);
        const limitedRes = await request(app).get('/limited').expect(429);

        expect(limitedRes.body).toEqual({
            error: 'Too many requests',
            retryAfter: 'Test retry message.'
        });
    });

    it('emits standard rate limit headers and omits legacy X-RateLimit headers', async () => {
        const app = buildLimitedApp(2);

        const res = await request(app).get('/limited').expect(200);

        expect(res.headers.ratelimit).toBeDefined();
        expect(res.headers['ratelimit-policy']).toBeDefined();
        expect(res.headers['x-ratelimit-limit']).toBeUndefined();
    });

    it('does not apply the general API fallback limiter to payment webhooks', async () => {
        const app = express();
        app.use('/api', generalApiLimiterFallback);
        app.post('/api/payments/webhook', (req, res) => res.status(204).send());

        const res = await request(app).post('/api/payments/webhook').expect(204);

        expect(res.headers.ratelimit).toBeUndefined();
        expect(res.headers['ratelimit-policy']).toBeUndefined();
    });
});
