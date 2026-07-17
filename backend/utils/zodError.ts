import { ZodError } from "zod";

/**
 * Format a ZodError into a structured API error response body.
 * The top-level `error` is the first issue's message so callers
 * can assert on `res.body.error` without unpacking `issues`.
 */
export const formatZodError = (err: ZodError) => {
  const issues = err.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
  return {
    error: issues[0]?.message ?? "Validation failed",
    issues,
  };
};
