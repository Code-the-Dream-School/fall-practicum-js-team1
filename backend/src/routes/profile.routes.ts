import { Router } from 'express';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getMyClaims } from '../controllers/claimList.controller.js';

const router = Router();

router.get('/claims', jwtMiddleware, asyncHandler(getMyClaims));

export default router;
