import { useQueries } from '@tanstack/react-query';
import { getMessages } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { messagesKey } from '@/components/messages/useMessageSocket';

export const useUnreadMessages = (claimIds: string[]) => {
  const user = useAuthStore((state) => state.user);

  return useQueries({
    queries: claimIds.map((claimId) => ({
      queryKey: messagesKey(claimId),
      queryFn: () => getMessages({ claimId }),
    })),
    combine: (results) => {
      const unreadByClaim: Record<string, number> = {};
      results.forEach((result, index) => {
        const claimId = claimIds[index];
        if (claimId === undefined) return;
        unreadByClaim[claimId] = (result.data ?? []).filter(
          (message) => message.senderId !== user?.id && message.readAt === null,
        ).length;
      });
      return unreadByClaim;
    },
  });
};
