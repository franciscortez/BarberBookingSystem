require('dotenv').config();

/**
 * Script to automatically create a PayMongo Webhook
 * Usage: node scripts/create_webhook.js <YOUR_PUBLIC_URL>/api/payments/webhook
 */
const createWebhook = async () => {
    const webhookUrl = process.argv[2];
    
    if (!webhookUrl) {
        console.error('Usage: node scripts/create_webhook.js <YOUR_WEBHOOK_URL>');
        console.error('Example: node scripts/create_webhook.js https://xyz.ngrok-free.app/api/payments/webhook');
        process.exit(1);
    }

    // Determine which secret key to use based on NODE_ENV
    const isProd = process.env.NODE_ENV === 'production';
    const secretKey = isProd 
        ? process.env.PAYMONGO_LIVE_SECRET_KEY 
        : process.env.PAYMONGO_TEST_SECRET_KEY;

    if (!secretKey || secretKey.includes('your_paymongo')) {
        console.error(`Error: PAYMONGO_${isProd ? 'LIVE' : 'TEST'}_SECRET_KEY is not set in .env`);
        process.exit(1);
    }

    const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;

    const payload = {
        data: {
            attributes: {
                events: [
                    'checkout_session.payment.paid',
                    'payment.failed'
                ],
                url: webhookUrl
            }
        }
    };

    console.log(`Creating webhook for: ${webhookUrl} using ${isProd ? 'LIVE' : 'TEST'} keys...`);

    try {
        const response = await fetch('https://api.paymongo.com/v1/webhooks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('PayMongo API Error:');
            console.error(JSON.stringify(data, null, 2));
            return;
        }

        console.log('\n✅ Webhook created successfully!');
        console.log('----------------------------------------------------');
        console.log(`ID:     ${data.data.id}`);
        console.log(`URL:    ${data.data.attributes.url}`);
        console.log(`SECRET: ${data.data.attributes.secret_key}`);
        console.log('----------------------------------------------------');
        console.log('\nACTION REQUIRED:');
        console.log(`Copy the SECRET above and update your .env file:`);
        console.log(`PAYMONGO_${isProd ? 'LIVE' : 'TEST'}_WEBHOOK_SECRET=${data.data.attributes.secret_key}`);
        
    } catch (error) {
        console.error('\n❌ Execution Error:', error.message);
        if (error.message.includes('fetch is not defined')) {
            console.error('Note: This script requires Node.js v18 or higher for native fetch support.');
        }
    }
};

createWebhook();
