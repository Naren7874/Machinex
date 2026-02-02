import { Router } from 'express';
import {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  sendInquiry,
  trackWhatsAppClick,
} from '../controllers/listing.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/listings
 * @desc    Get all listings with filters
 * @access  Public
 */
router.get('/', optionalAuth, getAllListings);

/**
 * @route   GET /api/listings/my-listings
 * @desc    Get current user's listings
 * @access  Private
 */
router.get('/my-listings', authenticate, getMyListings);

/**
 * @route   GET /api/listings/:id
 * @desc    Get single listing
 * @access  Public
 */
router.get('/:id', optionalAuth, getListingById);

/**
 * @route   POST /api/listings
 * @desc    Create new listing
 * @access  Private
 */
router.post('/', authenticate, createListing);

/**
 * @route   PUT /api/listings/:id
 * @desc    Update listing
 * @access  Private (owner only)
 */
router.put('/:id', authenticate, updateListing);

/**
 * @route   DELETE /api/listings/:id
 * @desc    Delete listing (soft delete)
 * @access  Private (owner only)
 */
router.delete('/:id', authenticate, deleteListing);

/**
 * @route   POST /api/listings/:id/inquiry
 * @desc    Send inquiry for a listing and get seller contact info
 * @access  Private (authentication required to protect seller PII)
 */
router.post('/:id/inquiry', authenticate, sendInquiry);

/**
 * @route   POST /api/listings/:id/whatsapp-click
 * @desc    Track WhatsApp click
 * @access  Public
 */
router.post('/:id/whatsapp-click', trackWhatsAppClick);

export default router;
