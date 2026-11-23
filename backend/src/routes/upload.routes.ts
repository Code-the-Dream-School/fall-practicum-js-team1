import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import type { AuthenticatedRequest } from '../middleware/jwtMiddleware.js';
import { getUploadSignature } from '../controllers/upload.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      throw new Error('Upload rate limiter requires authentication');
    }

    return userId;
  },
  message: {
    success: false,
    message: 'Too many upload requests. Please try again later.',
  },
});

router.post(
  '/signature',
  asyncHandler(jwtMiddleware),
  uploadLimiter,
  asyncHandler(getUploadSignature),
);

export default router;
