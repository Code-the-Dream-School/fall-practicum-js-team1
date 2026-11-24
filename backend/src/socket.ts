import type { Server as HttpServer } from 'node:http';
import process from 'node:process';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { loadClaimForParticipant } from './utils/claimAccess.js';
import { claimIdSchema } from './validator/message.validator.js';

const JOIN_EVENT = 'join-claim';
const CHANGED_EVENT = 'messages-changed';

type JoinReply = (result: { ok: boolean }) => void;

let io: Server | undefined;

const roomOf = (claimId: string) => `claim:${claimId}`;
const userRoomOf = (userId: string) => `user:${userId}`;

const getUserIdFromCookie = (cookieHeader: string | undefined) => {
  const token = parse(cookieHeader ?? '')['jwt'];
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return undefined;
  }

  try {
    const payload = jwt.verify(token, secret);
    const id = typeof payload === 'object' ? payload['id'] : undefined;
    return typeof id === 'string' ? id : undefined;
  } catch {
    return undefined;
  }
};

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const userId = getUserIdFromCookie(socket.request.headers.cookie);

    if (!userId) {
      return next(new Error('Please sign in'));
    }

    socket.data['userId'] = userId;
    next();
  });

  io.on('connection', (socket) => {
    // every connection also listens for its own user, so lists can update
    void socket.join(userRoomOf(socket.data['userId']));

    socket.on(JOIN_EVENT, async (claimId: unknown, reply?: JoinReply) => {
      const answer: JoinReply = typeof reply === 'function' ? reply : () => {};
      const parsed = claimIdSchema.safeParse(claimId);

      if (!parsed.success) {
        return answer({ ok: false });
      }

      try {
        await loadClaimForParticipant(parsed.data, socket.data['userId']);
        await socket.join(roomOf(parsed.data));
        answer({ ok: true });
      } catch {
        answer({ ok: false });
      }
    });
  });

  return io;
};

export const emitMessagesChanged = (
  claimId: string,
  participantIds: string[],
) => {
  io?.to(roomOf(claimId))
    .to(participantIds.map(userRoomOf))
    .emit(CHANGED_EVENT, claimId);
};
