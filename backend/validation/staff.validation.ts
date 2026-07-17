import { z } from "zod";

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, "Invalid time");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

export const AppointmentFiltersSchema = z.object({
  date: date.optional(),
  status: z.string().optional(),
  barberId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  paymentStatus: z.string().optional(),
  search: z.string().trim().max(100).optional(),
});
export const AppointmentStatusSchema = z.object({
  status: z.enum(["checked_in", "completed", "no_show", "cancelled"]),
});
export const StaffRescheduleSchema = z.object({
  appointment_date: date,
  start_time: time,
});
export const BarberProfileSchema = z.object({
  name: z.string().trim().min(2).max(255),
  phone: z.string().trim().min(7).max(50),
});
export const ActiveStateSchema = z.object({ is_active: z.boolean() });
export const InviteBarberSchema = BarberProfileSchema.extend({
  email: z.string().trim().email().max(255),
});
export const AcceptInvitationSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).max(72),
});
export const InvitationTokenSchema = z.object({ token: z.string().min(32) });
export const WorkingHourSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    start_time: time,
    end_time: time,
  })
  .refine((value) => value.start_time < value.end_time, {
    message: "start_time must be before end_time",
  });
export const ReplaceWorkingHoursSchema = z.object({
  hours: z.array(WorkingHourSchema).max(30),
});
export const AvailabilityBlockSchema = z
  .object({
    block_date: date,
    start_time: time,
    end_time: time,
    reason: z.string().trim().max(255).optional(),
  })
  .refine((value) => value.start_time < value.end_time, {
    message: "start_time must be before end_time",
  });

export type AppointmentFilters = z.infer<typeof AppointmentFiltersSchema>;
export type StaffRescheduleInput = z.infer<typeof StaffRescheduleSchema>;
export type BarberProfileInput = z.infer<typeof BarberProfileSchema>;
export type InviteBarberInput = z.infer<typeof InviteBarberSchema>;
export type WorkingHourInput = z.infer<typeof WorkingHourSchema>;
export type AvailabilityBlockInput = z.infer<typeof AvailabilityBlockSchema>;
