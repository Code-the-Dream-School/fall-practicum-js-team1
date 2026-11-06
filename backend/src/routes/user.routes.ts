import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { register, logon, logoff, me } from '../controllers/user.controller.js';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/logon', asyncHandler(logon));
router.post('/logoff', logoff);

router.get('/me', jwtMiddleware, asyncHandler(me));

export default router;
