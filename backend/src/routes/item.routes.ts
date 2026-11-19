import { Router } from 'express';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createItem } from '../controllers/item.controller.js';
import { getItemById } from '../controllers/item.controller.js';
import { createClaim } from '../controllers/claim.controller.js';
import { getItemClaims } from '../controllers/claimList.controller.js';

const router = Router();

router.post('/', jwtMiddleware, asyncHandler(createItem));
router.get('/:id', asyncHandler(getItemById));
router.post('/:id/claims', jwtMiddleware, asyncHandler(createClaim));
router.get('/:id/claims', jwtMiddleware, asyncHandler(getItemClaims));

export default router;
