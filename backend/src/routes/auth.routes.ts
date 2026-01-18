import { Router } from 'express';
import {
    register,
    login,
    sendOtp,
    verifyOtp,
    getMe,
    updateProfile,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (sends OTP, no token)
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user (sends OTP, no token)
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to phone number
 * @access  Public
 */
router.post('/send-otp', sendOtp);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and get token
 * @access  Public
 */
router.post('/verify-otp', verifyOtp);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private (verified users only)
 */
router.get('/me', authenticate, getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private (verified users only)
 */
router.put('/profile', authenticate, updateProfile);

export default router;
