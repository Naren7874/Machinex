import { Router } from 'express';
import authRoutes from './auth.routes';
import listingRoutes from './listing.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/listings', listingRoutes);

export default router;
