import { Router } from 'express';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createItem,
  getItems,
  getItemById,
} from '../controllers/item.controller.js';
import { createClaim } from '../controllers/claim.controller.js';
import { getItemClaims } from '../controllers/claimList.controller.js';
import { markItemPickedUp } from '../controllers/claimStatus.controller.js';
import {
  withdrawItem,
  restoreItem,
} from '../controllers/withdraw.controller.js';

const router = Router();

router.get('/', asyncHandler(getItems));
router.post('/', jwtMiddleware, asyncHandler(createItem));
router.get('/:id', asyncHandler(getItemById));
router.post('/:id/claims', jwtMiddleware, asyncHandler(createClaim));
router.get('/:id/claims', jwtMiddleware, asyncHandler(getItemClaims));
router.patch('/:id/picked-up', jwtMiddleware, asyncHandler(markItemPickedUp));
router.patch('/:id/withdraw', jwtMiddleware, asyncHandler(withdrawItem));
router.patch('/:id/restore', jwtMiddleware, asyncHandler(restoreItem));

export default router;
