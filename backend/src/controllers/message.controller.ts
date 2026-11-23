import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { AuthenticatedRequest } from '../middleware/jwtMiddleware.js';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from '../utils/apiError.js';
import { loadClaimForParticipant } from '../utils/claimAccess.js';
import { decryptMessage, encryptMessage } from '../utils/messageCrypto.js';
import { emitMessagesChanged } from '../socket.js';
import {
  claimIdSchema,
  sendMessageSchema,
} from '../validator/message.validator.js';

const messageSelect = {
  id: true,
  claimId: true,
  senderId: true,
  body: true,
  readAt: true,
  createdAt: true,
};

// Swaps the stored (encrypted) body for the readable one before it leaves the server
const toReadable = <T extends { body: string }>(message: T): T => ({
  ...message,
  body: decryptMessage(message.body),
});

const participantsOf = (claim: {
  claimerId: string;
  item: { ownerId: string };
}) => [claim.claimerId, claim.item.ownerId];

const getUserId = (req: AuthenticatedRequest): string => {
  if (!req.user) {
    throw new ApiError('No user is authenticated.', StatusCodes.UNAUTHORIZED);
  }

  return req.user.id;
};

const getClaimId = (req: AuthenticatedRequest): string => {
  const result = claimIdSchema.safeParse(req.params.id);

  if (!result.success) {
    throw new ApiError(
      result.error.issues[0]?.message ?? 'Invalid claim ID',
      StatusCodes.BAD_REQUEST,
    );
  }

  return result.data;
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  const userId = getUserId(req);
  const claimId = getClaimId(req);

  const result = sendMessageSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(
      result.error.issues[0]?.message ?? 'Invalid data',
      StatusCodes.BAD_REQUEST,
    );
  }

  const claim = await loadClaimForParticipant(claimId, userId);

  if (claim.status !== 'pending' && claim.status !== 'approved') {
    throw new ApiError(
      'This claim is closed, messages cannot be sent',
      StatusCodes.CONFLICT,
    );
  }

  const message = await prisma.claimMessage.create({
    data: {
      claimId,
      senderId: userId,
      body: encryptMessage(result.data.body),
    },
    select: messageSelect,
  });

  emitMessagesChanged(claimId, participantsOf(claim));

  res
    .status(StatusCodes.CREATED)
    .json({ success: true, data: toReadable(message) });
};

export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  const userId = getUserId(req);
  const claimId = getClaimId(req);

  await loadClaimForParticipant(claimId, userId);

  const messages = await prisma.claimMessage.findMany({
    where: { claimId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: messageSelect,
  });

  res
    .status(StatusCodes.OK)
    .json({ success: true, data: messages.map(toReadable) });
};

export const markMessagesRead = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = getUserId(req);
  const claimId = getClaimId(req);

  const claim = await loadClaimForParticipant(claimId, userId);

  const { count } = await prisma.claimMessage.updateMany({
    where: {
      claimId,
      senderId: { not: userId },
      readAt: null,
      deletedAt: null,
    },
    data: { readAt: new Date() },
  });

  if (count > 0) {
    emitMessagesChanged(claimId, participantsOf(claim));
  }

  res
    .status(StatusCodes.OK)
    .json({ success: true, data: { updatedCount: count } });
};
