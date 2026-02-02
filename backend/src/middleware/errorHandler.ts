import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Common error factory methods
 */
export const Errors = {
    badRequest: (message = 'Bad request') => new ApiError(message, 400),
    unauthorized: (message = 'Unauthorized') => new ApiError(message, 401),
    forbidden: (message = 'Forbidden') => new ApiError(message, 403),
    notFound: (message = 'Resource not found') => new ApiError(message, 404),
    conflict: (message = 'Conflict') => new ApiError(message, 409),
    validation: (message = 'Validation error') => new ApiError(message, 422),
    internal: (message = 'Internal server error') => new ApiError(message, 500),
};

/**
 * Handle Mongoose CastError (invalid ObjectId)
 */
const handleCastError = (err: Error & { path?: string }): ApiError => {
    const message = `Invalid ${err.path}: Invalid ID format`;
    return new ApiError(message, 400);
};

/**
 * Handle Mongoose duplicate key error
 */
const handleDuplicateKeyError = (err: Error & { keyValue?: Record<string, unknown> }): ApiError => {
    const field = Object.keys(err.keyValue || {})[0];
    const message = `${field} already exists`;
    return new ApiError(message, 409);
};

/**
 * Handle Mongoose validation error
 */
const handleValidationError = (err: Error & { errors?: Record<string, { message: string }> }): ApiError => {
    const errors = Object.values(err.errors || {}).map((e) => e.message);
    const message = errors.join('. ');
    return new ApiError(message, 422);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
    err: Error & { statusCode?: number; code?: number; isOperational?: boolean },
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let error = err;

    // Handle specific error types
    if (err.name === 'CastError') {
        error = handleCastError(err);
    }

    if (err.code === 11000) {
        error = handleDuplicateKeyError(err as Error & { keyValue?: Record<string, unknown> });
    }

    if (err.name === 'ValidationError') {
        error = handleValidationError(err as Error & { errors?: Record<string, { message: string }> });
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    // Log error
    if (statusCode >= 500) {
        logger.error('Server Error:', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
        });
    } else {
        logger.warn('Client Error:', {
            message: err.message,
            statusCode,
            url: req.originalUrl,
        });
    }

    // Send response
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
        }),
    });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = <T>(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
