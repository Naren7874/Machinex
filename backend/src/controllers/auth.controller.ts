import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models';
import { asyncHandler, Errors } from '../middleware/errorHandler';
import logger from '../utils/logger';
import whatsappService from '../services/whatsapp.service';

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
 * Generate 6-digit secure OTP using crypto
 */
const generateOtp = (): string => {
    return crypto.randomInt(100000, 999999).toString();
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (does NOT issue token until verified)
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

    // Generate OTP
    const otp = generateOtp();

    // Create user with isVerified=false
    const user = await User.create({
        name,
        phone,
        email,
        isVerified: false,
        verificationCode: otp, // Will be hashed in pre-save
        verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP via WhatsApp
    await whatsappService.sendOtp(phone, otp);
    logger.info(`Registration OTP generated for ${phone.slice(-4).padStart(phone.length, '*')}`);

    res.status(201).json({
        success: true,
        message: 'Registration initiated. Please verify your phone with the OTP sent.',
        data: {
            phone: user.phone,
            requiresVerification: true,
            expiresIn: '10 minutes',
        },
    });
});

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to phone (for existing or new users)
 * @access  Public
 */
export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body;

    if (!phone) {
        throw Errors.badRequest('Please provide phone number');
    }

    // Find user
    const user = await User.findOne({ phone });

    if (!user) {
        throw Errors.notFound('User not found. Please register first.');
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        const remainingTime = Math.ceil(
            (user.accountLockedUntil.getTime() - Date.now()) / 60000
        );
        throw Errors.unauthorized(
            `Account is temporarily locked. Try again in ${remainingTime} minutes.`
        );
    }

    // Generate new OTP
    const otp = generateOtp();

    // Update user with new OTP
    user.verificationCode = otp;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send OTP via WhatsApp
    await whatsappService.sendOtp(phone, otp);
    logger.info(`OTP generated for ${phone.slice(-4).padStart(phone.length, '*')}`);

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
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and issue token (for both registration and login)
 * @access  Public
 */
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { phone, verificationCode } = req.body;

    // Validate required fields
    if (!phone || !verificationCode) {
        throw Errors.badRequest('Please provide phone and verification code');
    }

    // Find user
    const user = await User.findOne({ phone });

    if (!user) {
        throw Errors.notFound('User not found');
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        throw Errors.unauthorized('Account is temporarily locked. Try again later.');
    }

    // Check if OTP is expired
    if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
        throw Errors.badRequest('Verification code has expired. Please request a new one.');
    }

    // Verify OTP
    const isMatch = await user.compareVerificationCode(verificationCode);

    if (!isMatch) {
        // Increment login attempts
        user.loginAttempts += 1;

        if (user.loginAttempts >= 5) {
            await user.lockAccount();
            throw Errors.unauthorized(
                'Too many failed attempts. Account locked for 15 minutes.'
            );
        }

        await user.save();
        throw Errors.unauthorized(
            `Invalid verification code. ${5 - user.loginAttempts} attempts remaining.`
        );
    }

    // OTP is valid - mark user as verified and issue token
    user.isVerified = true;
    user.loginAttempts = 0;
    user.lastLogin = new Date();
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    logger.info(`User verified and logged in: ${phone}`);

    res.json({
        success: true,
        message: 'Verification successful',
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
 * @route   POST /api/auth/login
 * @desc    Login - sends OTP (does NOT issue token directly)
 * @access  Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body;

    // Validate required fields
    if (!phone) {
        throw Errors.badRequest('Please provide phone number');
    }

    // Find user
    const user = await User.findOne({ phone });

    if (!user) {
        throw Errors.unauthorized('User not found. Please register first.');
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        const remainingTime = Math.ceil(
            (user.accountLockedUntil.getTime() - Date.now()) / 60000
        );
        throw Errors.unauthorized(
            `Account is temporarily locked. Try again in ${remainingTime} minutes.`
        );
    }

    // Generate and send OTP
    const otp = generateOtp();

    user.verificationCode = otp;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send OTP via WhatsApp
    await whatsappService.sendOtp(phone, otp);
    logger.info(`Login OTP generated for ${phone.slice(-4).padStart(phone.length, '*')}`);

    res.json({
        success: true,
        message: 'OTP sent to your phone. Please verify to complete login.',
        data: {
            phone,
            requiresVerification: true,
            expiresIn: '10 minutes',
        },
    });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private (verified users only)
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
 * @access  Private (verified users only)
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
