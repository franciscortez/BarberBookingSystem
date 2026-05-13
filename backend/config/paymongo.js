const paymongoConfig = {
    secretKey: process.env.NODE_ENV === 'production' 
        ? process.env.PAYMONGO_LIVE_SECRET_KEY 
        : process.env.PAYMONGO_TEST_SECRET_KEY,
    publicKey: process.env.NODE_ENV === 'production' 
        ? process.env.PAYMONGO_LIVE_PUBLIC_KEY 
        : process.env.PAYMONGO_TEST_PUBLIC_KEY,
    webhookSecret: process.env.NODE_ENV === 'production' 
        ? process.env.PAYMONGO_LIVE_WEBHOOK_SECRET 
        : process.env.PAYMONGO_TEST_WEBHOOK_SECRET
};

module.exports = paymongoConfig;
