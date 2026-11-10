
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  requireAuth,
  requireCsrf,
} from '../middleware/jwtMiddleware.js';
import {
  register,
  logon,
  logoff,
  me,
} from '../controllers/user.controller.js';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/logon', asyncHandler(logon));

router.post('/logoff', requireAuth, requireCsrf, logoff);

router.get('/me', requireAuth, asyncHandler(me));

export default router;
