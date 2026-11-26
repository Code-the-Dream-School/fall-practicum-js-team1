import { Router } from 'express';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getMyClaims } from '../controllers/claimList.controller.js';
import { getMyItems, getMyStats } from '../controllers/profile.controller.js';

const router = Router();

router.get('/claims', jwtMiddleware, asyncHandler(getMyClaims));
router.get('/items', jwtMiddleware, asyncHandler(getMyItems));
router.get('/stats', jwtMiddleware, asyncHandler(getMyStats));

export default router;
