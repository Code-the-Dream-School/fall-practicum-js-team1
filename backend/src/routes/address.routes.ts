import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import {
  getAddresses,
  createAddress,
} from '../controllers/address.controller.js';

const router = Router();

router.get('/', jwtMiddleware, asyncHandler(getAddresses));
router.post('/', jwtMiddleware, asyncHandler(createAddress));

export default router;
