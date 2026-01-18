import { Request, Response } from 'express';
import { Listing } from '../models';
import { asyncHandler, Errors } from '../middleware/errorHandler';
import logger from '../utils/logger';

// Allowlist of sortable fields and directions
const ALLOWED_SORT_FIELDS = ['price', 'createdAt', 'views', 'inquiries', 'rating'] as const;
const ALLOWED_SORT_DIRECTIONS = ['asc', 'desc', '1', '-1'] as const;

/**
 * Parse and validate sort parameter
 * @param sortParam - Sort parameter from query (e.g., '-price', 'createdAt:desc')
 * @returns Sanitized sort object or default sort
 */
const parseSortParam = (sortParam: unknown): Record<string, 1 | -1> => {
    const defaultSort: Record<string, 1 | -1> = { createdAt: -1 };

    if (!sortParam || typeof sortParam !== 'string') {
        return defaultSort;
    }

    // Handle format: '-field' or 'field'
    if (sortParam.startsWith('-') || sortParam.startsWith('+')) {
        const direction = sortParam.startsWith('-') ? -1 : 1;
        const field = sortParam.slice(1);

        if (ALLOWED_SORT_FIELDS.includes(field as typeof ALLOWED_SORT_FIELDS[number])) {
            return { [field]: direction };
        }
        return defaultSort;
    }

    // Handle format: 'field:direction' or 'field'
    const [field, dir] = sortParam.split(':');

    if (!ALLOWED_SORT_FIELDS.includes(field as typeof ALLOWED_SORT_FIELDS[number])) {
        return defaultSort;
    }

    if (dir) {
        if (!ALLOWED_SORT_DIRECTIONS.includes(dir as typeof ALLOWED_SORT_DIRECTIONS[number])) {
            return defaultSort;
        }
        const direction = dir === 'desc' || dir === '-1' ? -1 : 1;
        return { [field]: direction };
    }

    return { [field]: 1 };
};

/**
 * @route   GET /api/listings
 * @desc    Get all listings with filters
 * @access  Public
 */
export const getAllListings = asyncHandler(async (req: Request, res: Response) => {
    const {
        category,
        machineType,
        location,
        minPrice,
        maxPrice,
        condition,
        brand,
        search,
        status = 'approved',
        sort,
        page = 1,
        limit = 10,
    } = req.query;

    // Build query
    const query: Record<string, unknown> = { status };

    if (category) query.category = category;
    if (machineType) query.machineType = machineType;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (condition) query.condition = condition;
    if (brand) query.brand = { $regex: brand, $options: 'i' };

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) (query.price as Record<string, number>).$gte = Number(minPrice);
        if (maxPrice) (query.price as Record<string, number>).$lte = Number(maxPrice);
    }

    if (search) {
        query.$text = { $search: search as string };
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Validate and sanitize sort parameter
    const sanitizedSort = parseSortParam(sort);

    // Execute query
    const [listings, total] = await Promise.all([
        Listing.find(query)
            .populate('seller', 'name phone location rating')
            .sort(sanitizedSort)
            .skip(skip)
            .limit(limitNum),
        Listing.countDocuments(query),
    ]);

    res.json({
        success: true,
        data: {
            listings,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        },
    });
});

/**
 * @route   GET /api/listings/:id
 * @desc    Get single listing
 * @access  Public
 */
export const getListingById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const listing = await Listing.findById(id).populate('seller', 'name phone location rating');

    if (!listing) {
        throw Errors.notFound('Listing not found');
    }

    // Increment views
    await listing.incrementView();

    res.json({
        success: true,
        data: { listing },
    });
});

/**
 * @route   POST /api/listings
 * @desc    Create new listing
 * @access  Private
 */
export const createListing = asyncHandler(async (req: Request, res: Response) => {
    const seller = req.user;

    if (!seller) {
        throw Errors.unauthorized('Not authenticated');
    }

    const listingData = {
        ...req.body,
        seller: seller._id,
        sellerPhone: seller.phone,
        sellerName: seller.name,
    };

    const listing = await Listing.create(listingData);

    // Update user's listings count
    seller.listingsCount += 1;
    await seller.save();

    logger.info(`New listing created: ${listing._id} by ${seller.phone}`);

    res.status(201).json({
        success: true,
        message: 'Listing created successfully',
        data: { listing },
    });
});

/**
 * @route   PUT /api/listings/:id
 * @desc    Update listing
 * @access  Private (owner only)
 */
export const updateListing = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
        throw Errors.unauthorized('Not authenticated');
    }

    let listing = await Listing.findById(id);

    if (!listing) {
        throw Errors.notFound('Listing not found');
    }

    // Check ownership
    if (listing.seller.toString() !== user._id.toString() && user.role !== 'admin') {
        throw Errors.forbidden('Not authorized to update this listing');
    }

    // Update
    listing = await Listing.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
    });

    logger.info(`Listing updated: ${id} by ${user.phone}`);

    res.json({
        success: true,
        message: 'Listing updated successfully',
        data: { listing },
    });
});

/**
 * @route   DELETE /api/listings/:id
 * @desc    Delete listing (soft delete)
 * @access  Private (owner only)
 */
export const deleteListing = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
        throw Errors.unauthorized('Not authenticated');
    }

    const listing = await Listing.findById(id);

    if (!listing) {
        throw Errors.notFound('Listing not found');
    }

    // Check ownership
    if (listing.seller.toString() !== user._id.toString() && user.role !== 'admin') {
        throw Errors.forbidden('Not authorized to delete this listing');
    }

    // Soft delete
    listing.status = 'archived';
    await listing.save();

    logger.info(`Listing deleted: ${id} by ${user.phone}`);

    res.json({
        success: true,
        message: 'Listing deleted successfully',
    });
});

/**
 * @route   GET /api/listings/my-listings
 * @desc    Get current user's listings
 * @access  Private
 */
export const getMyListings = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
        throw Errors.unauthorized('Not authenticated');
    }

    const { status, page = 1, limit = 10 } = req.query;

    const query: Record<string, unknown> = {
        seller: user._id,
        status: { $ne: 'archived' },
    };

    if (status) query.status = status;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [listings, total] = await Promise.all([
        Listing.find(query).sort('-createdAt').skip(skip).limit(limitNum),
        Listing.countDocuments(query),
    ]);

    res.json({
        success: true,
        data: {
            listings,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        },
    });
});

/**
 * @route   POST /api/listings/:id/inquiry
 * @desc    Send inquiry for a listing (increments inquiry count)
 * @access  Public
 */
export const sendInquiry = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        throw Errors.notFound('Listing not found');
    }

    await listing.incrementInquiry();

    res.json({
        success: true,
        message: 'Inquiry sent successfully',
        data: {
            sellerPhone: listing.sellerPhone,
            sellerName: listing.sellerName,
        },
    });
});

/**
 * @route   POST /api/listings/:id/whatsapp-click
 * @desc    Track WhatsApp click
 * @access  Public
 */
export const trackWhatsAppClick = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        throw Errors.notFound('Listing not found');
    }

    await listing.incrementWhatsAppClicks();

    res.json({
        success: true,
        message: 'WhatsApp click tracked',
    });
});
