import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { decideClaim } from '../controllers/claim.controller.js';
import {
  cancelClaim,
  markNoShow,
} from '../controllers/claimStatus.controller.js';
import {
  sendMessage,
  getMessages,
  markMessagesRead,
} from '../controllers/message.controller.js';

const router = Router();

router.patch('/:id', jwtMiddleware, asyncHandler(decideClaim));
router.patch('/:id/cancel', jwtMiddleware, asyncHandler(cancelClaim));
router.patch('/:id/no-show', jwtMiddleware, asyncHandler(markNoShow));

router.post('/:id/messages', jwtMiddleware, asyncHandler(sendMessage));
router.get('/:id/messages', jwtMiddleware, asyncHandler(getMessages));
router.patch(
  '/:id/messages/read',
  jwtMiddleware,
  asyncHandler(markMessagesRead),
);

export default router;
