import { Router } from 'express';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createItem,
  getItems,
  getItemById,
} from '../controllers/item.controller.js';
import { createClaim } from '../controllers/claim.controller.js';

const router = Router();

router.get('/', asyncHandler(getItems));
router.post('/', jwtMiddleware, asyncHandler(createItem));
router.get('/:id', asyncHandler(getItemById));
router.post('/:id/claims', jwtMiddleware, asyncHandler(createClaim));

export default router;
