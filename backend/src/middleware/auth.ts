import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, type IUser } from '../models';
import logger from '../utils/logger';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

interface JwtPayload {
    id: string;
    iat: number;
    exp: number;
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined');
        }

        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

        // Find user
        const user = await User.findById(decoded.id);

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found.',
            });
            return;
        }

        // Check if account is locked
        if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
            res.status(401).json({
                success: false,
                message: 'Account is temporarily locked.',
            });
            return;
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);

        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.',
            });
            return;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'Invalid token.',
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Authentication failed.',
        });
    }
};

/**
 * Authorization middleware - checks user role
 */
export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated.',
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to access this resource.',
            });
            return;
        }

        next();
    };
};

/**
 * Optional authentication - attaches user if token exists
 */
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const jwtSecret = process.env.JWT_SECRET;

            if (jwtSecret) {
                const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
                const user = await User.findById(decoded.id);
                if (user && (!user.accountLockedUntil || user.accountLockedUntil <= new Date())) {
                    req.user = user;
                }
            }
        }

        next();
    } catch {
        // Token invalid or expired, continue without user
        next();
    }
};
