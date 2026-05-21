const {
    sendConfirmationEmail,
    sendRescheduleConfirmationEmail,
    sendCancellationConfirmationEmail
} = require('./emailService');

const emailHandlers = {
    bookingConfirmation: sendConfirmationEmail,
    rescheduleConfirmation: sendRescheduleConfirmationEmail,
    cancellationConfirmation: sendCancellationConfirmationEmail
};

const pendingEmailJobs = new Set();

const enqueueEmailJob = (type, appointment) => {
    const handler = emailHandlers[type];
    if (!handler) {
        throw new Error(`Unknown email job type: ${type}`);
    }

    let job;
    job = Promise.resolve()
        .then(() => handler(appointment))
        .catch((error) => {
            console.error(`Email job failed (${type}):`, error);
        })
        .finally(() => {
            pendingEmailJobs.delete(job);
        });

    pendingEmailJobs.add(job);
    return job;
};

const flushEmailJobs = async () => {
    await Promise.allSettled(Array.from(pendingEmailJobs));
};

module.exports = {
    enqueueEmailJob,
    flushEmailJobs
};
