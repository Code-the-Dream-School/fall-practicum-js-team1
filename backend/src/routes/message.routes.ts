import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import {
  sendMessage,
  getMessages,
  markMessagesRead,
} from '../controllers/message.controller.js';

const router = Router();

router.post('/:id/messages', jwtMiddleware, asyncHandler(sendMessage));
router.get('/:id/messages', jwtMiddleware, asyncHandler(getMessages));
router.patch(
  '/:id/messages/read',
  jwtMiddleware,
  asyncHandler(markMessagesRead),
);

export default router;
