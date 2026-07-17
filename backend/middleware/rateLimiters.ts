import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

const parsePositiveInt = (
  value: string | undefined,
  fallback: number,
): number => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildRateLimitHandler =
  (message: string) => (req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many requests",
      retryAfter: message,
    });
  };

interface CreateRateLimiterInput {
  windowMs: number;
  limit: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

export const createRateLimiter = ({
  windowMs,
  limit,
  message = "Please try again later.",
  skipSuccessfulRequests = false,
}: CreateRateLimiterInput) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: buildRateLimitHandler(message),
  });

const generalApiLimiter = createRateLimiter({
  windowMs: parsePositiveInt(
    process.env.RATE_LIMIT_GENERAL_WINDOW_MS,
    15 * 60 * 1000,
  ),
  limit: parsePositiveInt(process.env.RATE_LIMIT_GENERAL_MAX, 300),
});

export const catalogReadLimiter = createRateLimiter({
  windowMs: parsePositiveInt(
    process.env.RATE_LIMIT_CATALOG_WINDOW_MS,
    15 * 60 * 1000,
  ),
  limit: parsePositiveInt(process.env.RATE_LIMIT_CATALOG_MAX, 600),
});

export const availabilityLimiter = createRateLimiter({
  windowMs: parsePositiveInt(
    process.env.RATE_LIMIT_AVAILABILITY_WINDOW_MS,
    5 * 60 * 1000,
  ),
  limit: parsePositiveInt(process.env.RATE_LIMIT_AVAILABILITY_MAX, 120),
});

export const authLimiter = createRateLimiter({
  windowMs: parsePositiveInt(
    process.env.RATE_LIMIT_AUTH_WINDOW_MS,
    15 * 60 * 1000,
  ),
  limit: parsePositiveInt(process.env.RATE_LIMIT_AUTH_MAX, 10),
  message: "Too many login attempts. Please try again later.",
});

export const bookingMutationLimiter = createRateLimiter({
  windowMs: parsePositiveInt(
    process.env.RATE_LIMIT_BOOKING_WINDOW_MS,
    15 * 60 * 1000,
  ),
  limit: parsePositiveInt(process.env.RATE_LIMIT_BOOKING_MAX, 20),
  message: "Too many booking requests. Please try again later.",
});

const isSpecializedRateLimitedRoute = (req: Request): boolean => {
  if (req.path === "/payments/webhook") {
    return true;
  }

  if (
    req.method === "GET" &&
    (req.path === "/catalog" ||
      req.path.startsWith("/barbers") ||
      req.path.startsWith("/services") ||
      req.path.startsWith("/availability"))
  ) {
    return true;
  }

  if (req.method === "POST" && req.path === "/auth/login") {
    return true;
  }

  return (
    req.method === "POST" &&
    (req.path === "/appointments" ||
      req.path === "/appointments/reschedule" ||
      req.path === "/appointments/cancel")
  );
};

export const generalApiLimiterFallback = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (isSpecializedRateLimitedRoute(req)) {
    return next();
  }

  return generalApiLimiter(req, res, next);
};
