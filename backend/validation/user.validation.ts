import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const UnifiedLoginSchema = z
  .object({
    identifier: z.string().optional(),
    username: z.string().optional(),
    email: z.string().optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => data.identifier || data.username || data.email, {
    message: "Email or username is required",
    path: ["identifier"],
  });

export type UnifiedLoginInput = z.infer<typeof UnifiedLoginSchema>;

export const UserLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export type UserLoginInput = z.infer<typeof UserLoginSchema>;

export const BarberLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export type BarberLoginInput = z.infer<typeof BarberLoginSchema>;
