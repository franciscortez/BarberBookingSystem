import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { formatZodError } from "../utils/zodError";

/**
 * Global Express error handler.
 * Register LAST in index.ts: app.use(errorHandler)
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // 1. Validation error from Zod
  if (err instanceof ZodError) {
    res.status(400).json(formatZodError(err));
    return;
  }

  // 2. Known application error
  if (err instanceof AppError) {
    const body: Record<string, unknown> = { error: err.message };
    if (err.details) body.details = err.details;
    res.status(err.statusCode).json(body);
    return;
  }

  // 3. Unknown / unexpected error
  const message =
    err instanceof Error ? err.message : "An unexpected error occurred";
  console.error("[Unhandled Error]", err);
  res.status(500).json({ error: message });
};
