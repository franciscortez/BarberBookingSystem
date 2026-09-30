import type { Role } from "../types";

export const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const getAuthDestination = (
  requested: unknown,
  role: Role,
  registering = false,
) => {
  if (
    typeof requested === "string" &&
    requested.startsWith("/") &&
    !requested.startsWith("//") &&
    !Array.from(requested).some(
      (character) => character === "\\" || character.charCodeAt(0) <= 32,
    ) &&
    !/^\/(login|signup)(?:[/?#]|$)/.test(requested)
  )
    return requested;
  return role === "admin"
    ? "/admin/dashboard"
    : role === "barber"
      ? "/barber/dashboard"
      : registering
        ? "/book"
        : "/";
};

export const validateContact = (
  name: string,
  email: string,
  phone: string,
) => ({
  name: name.trim() ? "" : "Enter your full name.",
  email: isValidEmail(email) ? "" : "Enter a valid email address.",
  phone: phone.trim() ? "" : "Enter your phone number.",
});
