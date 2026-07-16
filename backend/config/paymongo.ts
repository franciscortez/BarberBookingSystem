import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const secretKey = isProduction ? process.env.PAYMONGO_LIVE_SECRET_KEY : process.env.PAYMONGO_TEST_SECRET_KEY;
export const publicKey = isProduction ? process.env.PAYMONGO_LIVE_PUBLIC_KEY : process.env.PAYMONGO_TEST_PUBLIC_KEY;
export const webhookSecret = isProduction ? process.env.PAYMONGO_LIVE_WEBHOOK_SECRET : process.env.PAYMONGO_TEST_WEBHOOK_SECRET;
