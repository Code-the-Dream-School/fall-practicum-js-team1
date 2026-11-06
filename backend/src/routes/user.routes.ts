import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { register, login, logout, me } from '../controllers/user.controller.js';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/logout', logout);

router.get('/me', jwtMiddleware, asyncHandler(me));

export default router;
