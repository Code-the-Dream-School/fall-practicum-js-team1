import { USE_MOCKS } from '@/api/config';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

const JOIN_EVENT = 'join-claim';
const CHANGED_EVENT = 'messages-changed';

export const messagesKey = (claimId: string) => ['messages', claimId] as const;

const isMockMode = USE_MOCKS;

export const useMessageSocket = (claimId: string, enabled: boolean) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || isMockMode) {
      return;
    }

    const socket = io(import.meta.env['VITE_API_BASE_URL'], {
      withCredentials: true,
    });

    socket.on('connect', () => socket.emit(JOIN_EVENT, claimId));

    socket.on(CHANGED_EVENT, () => {
      void queryClient.invalidateQueries({ queryKey: messagesKey(claimId) });
    });

    return () => {
      socket.disconnect();
    };
  }, [claimId, enabled, queryClient]);
};

// for lists: the server puts every connection in its own user room,
// so there is nothing to join and any claim of this user can report a change
export const useMessageListSocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isMockMode) {
      return;
    }

    const socket = io(import.meta.env['VITE_API_BASE_URL'], {
      withCredentials: true,
    });

    socket.on(CHANGED_EVENT, (claimId: unknown) => {
      if (typeof claimId === 'string') {
        void queryClient.invalidateQueries({ queryKey: messagesKey(claimId) });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);
};
