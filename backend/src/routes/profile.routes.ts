import { Router } from 'express';

import { asyncHandler } from '../utils/asyncHandler.js';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import {
  getMyItems,
  getMyStats,
} from '../controllers/profile.controller.js'

const router = Router()

router.get('/items', jwtMiddleware, asyncHandler(getMyItems))
router.get('/stats', jwtMiddleware, asyncHandler(getMyStats))

export default router
