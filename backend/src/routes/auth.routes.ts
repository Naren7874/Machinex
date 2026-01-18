import { Router } from 'express';
import {
    register,
    login,
    sendOtp,
    getMe,
    updateProfile,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with phone + OTP
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
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, updateProfile);

export default router;
