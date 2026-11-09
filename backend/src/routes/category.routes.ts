import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getCategories } from '../controllers/category.controller.js';

const router = Router();

router.get('/', asyncHandler(getCategories));

export default router;
