import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { Router } from 'express';
import {
  withdrawItem,
  restoreItem,
} from '../controllers/withdraw.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.patch('/:id/withdraw', jwtMiddleware, asyncHandler(withdrawItem));
router.patch('/:id/restore', jwtMiddleware, asyncHandler(restoreItem));

export default router;
