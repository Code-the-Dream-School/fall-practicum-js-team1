import { useQueries } from '@tanstack/react-query';
import { getMessages } from '@/api/client';
import { useAuthStore } from '@/store/authStore';

// how many unread messages the other person sent, for each claim
// it reads the same query as the thread, so opening a thread marks the dot as read
export const useUnreadMessages = (claimIds: string[]) => {
  const user = useAuthStore((state) => state.user);

  return useQueries({
    queries: claimIds.map((claimId) => ({
      queryKey: ['messages', claimId],
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
