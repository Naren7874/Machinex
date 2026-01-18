import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { asyncHandler, Errors } from '../middleware/errorHandler';
import logger from '../utils/logger';

/**
 * Generate JWT token
 */
const generateToken = (userId: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }

    return jwt.sign({ id: userId }, secret, {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
    });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
    const { name, phone, email } = req.body;

    // Validate required fields
    if (!phone) {
        throw Errors.badRequest('Please provide phone number');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
        throw Errors.conflict('Phone number already registered');
    }

    // Create user
    const user = await User.create({
        name,
        phone,
        email,
    });

    // Generate token
    const token = generateToken(user._id.toString());

    logger.info(`New user registered: ${phone}`);

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: user.role,
            },
            token,
        },
    });
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user with phone + OTP verification
 * @access  Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
    const { phone, verificationCode } = req.body;

    // Validate required fields
    if (!phone) {
        throw Errors.badRequest('Please provide phone number');
    }

    // Find user
    const user = await User.findOne({ phone });

    if (!user) {
        throw Errors.unauthorized('User not found');
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        throw Errors.unauthorized('Account is temporarily locked. Try again later.');
    }

    // If verification code provided, verify it
    if (verificationCode) {
        const isMatch = await user.compareVerificationCode(verificationCode);

        if (!isMatch) {
            user.loginAttempts += 1;
            if (user.loginAttempts >= 5) {
                await user.lockAccount();
            }
            await user.save();
            throw Errors.unauthorized('Invalid verification code');
        }

        // Reset login attempts and mark as verified
        user.loginAttempts = 0;
        user.isVerified = true;
        user.lastLogin = new Date();
        await user.save();
    }

    // Generate token
    const token = generateToken(user._id.toString());

    logger.info(`User logged in: ${phone}`);

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
            },
            token,
        },
    });
});

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to phone
 * @access  Public
 */
export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body;

    if (!phone) {
        throw Errors.badRequest('Please provide phone number');
    }

    // Find or create user
    let user = await User.findOne({ phone });

    if (!user) {
        user = await User.create({ phone });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set verification code (will be hashed in pre-save)
    user.verificationCode = otp;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // TODO: Send OTP via WhatsApp/SMS
    logger.info(`OTP sent to ${phone}: ${otp}`); // Remove in production

    res.json({
        success: true,
        message: 'OTP sent successfully',
        data: {
            phone,
            expiresIn: '10 minutes',
        },
    });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
        throw Errors.unauthorized('Not authenticated');
    }

    res.json({
        success: true,
        data: {
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: user.role,
                location: user.location,
                isVerified: user.isVerified,
                whatsappName: user.whatsappName,
                whatsappProfilePic: user.whatsappProfilePic,
                notificationSettings: user.notificationSettings,
                listingsCount: user.listingsCount,
                ordersCount: user.ordersCount,
                rating: user.rating,
                createdAt: user.createdAt,
            },
        },
    });
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
        throw Errors.unauthorized('Not authenticated');
    }

    const { name, email, location, notificationSettings, preferredCategories } = req.body;

    // Update allowed fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (location) user.location = location;
    if (notificationSettings) user.notificationSettings = notificationSettings;
    if (preferredCategories) user.preferredCategories = preferredCategories;

    await user.save();

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
    });
});
