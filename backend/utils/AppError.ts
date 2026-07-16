/**
 * Application-level error with an HTTP status code.
 * Throw this anywhere in services/models; the global error handler maps it to a response.
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly details?: string;

    constructor(message: string, statusCode = 500, details?: string) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.details = details;
        // Maintain proper prototype chain in transpiled JS
        Object.setPrototypeOf(this, AppError.prototype);
    }

    static badRequest(message: string, details?: string): AppError {
        return new AppError(message, 400, details);
    }

    static unauthorized(message: string): AppError {
        return new AppError(message, 401);
    }

    static forbidden(message: string): AppError {
        return new AppError(message, 403);
    }

    static notFound(message: string): AppError {
        return new AppError(message, 404);
    }

    static conflict(message: string): AppError {
        return new AppError(message, 409);
    }

    static badGateway(message: string, details?: string): AppError {
        return new AppError(message, 502, details);
    }

    static internal(message: string, details?: string): AppError {
        return new AppError(message, 500, details);
    }
}
