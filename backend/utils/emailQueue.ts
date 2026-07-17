import {
  sendConfirmationEmail,
  sendRescheduleConfirmationEmail,
  sendCancellationConfirmationEmail,
} from "./emailService";
import { EmailAppointmentDetails } from "../types";

type EmailJobType =
  "bookingConfirmation" | "rescheduleConfirmation" | "cancellationConfirmation";

const emailHandlers: Record<
  EmailJobType,
  (appointment: EmailAppointmentDetails) => Promise<void>
> = {
  bookingConfirmation: sendConfirmationEmail,
  rescheduleConfirmation: sendRescheduleConfirmationEmail,
  cancellationConfirmation: sendCancellationConfirmationEmail,
};

const pendingEmailJobs = new Set<Promise<void>>();

export const enqueueEmailJob = (
  type: EmailJobType,
  appointment: EmailAppointmentDetails,
): Promise<void> => {
  const handler = emailHandlers[type];
  if (!handler) {
    throw new Error(`Unknown email job type: ${type}`);
  }

  let job: Promise<void>;
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

export const flushEmailJobs = async (): Promise<void> => {
  await Promise.allSettled(Array.from(pendingEmailJobs));
};
