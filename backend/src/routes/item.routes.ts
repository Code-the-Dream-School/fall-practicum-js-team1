import { Router } from 'express';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createItem, getItems } from '../controllers/item.controller.js';

const router = Router();

router.get('/', asyncHandler(getItems));
router.post('/', jwtMiddleware, asyncHandler(createItem));

export default router;
