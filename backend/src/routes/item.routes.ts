import { Router } from 'express';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createItem } from '../controllers/item.controller.js';
import { createClaim } from '../controllers/claim.controller.js';

const router = Router();

router.post('/', jwtMiddleware, asyncHandler(createItem));
router.post('/:id/claims', jwtMiddleware, asyncHandler(createClaim));

export default router;
