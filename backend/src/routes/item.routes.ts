import { Router } from 'express';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createItem } from '../controllers/item.controller.js';

const router = Router();

router.post('/', jwtMiddleware, asyncHandler(createItem));

export default router;
