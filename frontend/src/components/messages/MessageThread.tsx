import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMessages, readMessage, sendMessage } from '@/api/client';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { MessageInput } from '@/components/messages/MessageInput';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Skeleton } from '@/components/ui/skeleton';
import { useRestoreScroll } from '@/components/messages/useRestoreScroll';
import { useVisualViewport } from '@/components/messages/useVisualViewport';
import { useAuthStore } from '@/store/authStore';

type MessageThreadProps = {
  claimId: string;
  // the name shown on the messages of the other person
  otherPersonName: string;
  // a declined, cancelled, no show or picked up claim can only be read
  isClosed: boolean;
};

export const MessageThread = ({
  claimId,
  otherPersonName,
  isClosed,
}: MessageThreadProps) => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  useVisualViewport();
  useRestoreScroll();
  const queryKey = ['messages', claimId];
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    data: messages = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => getMessages({ claimId }),
  });

  // the messages of the other person are marked as read when the thread is open
  const { mutate: markRead } = useMutation({
    mutationFn: () => readMessage({ claimId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const hasUnread = messages.some(
    (message) => message.senderId !== user?.id && message.readAt === null,
  );
  useEffect(() => {
    if (hasUnread) {
      markRead();
    }
  }, [hasUnread, markRead]);

  // while it is sending, the message is already on the screen (see isPending below)
  const {
    mutate: send,
    isPending: isSending,
    isError: sendFailed,
    error: sendError,
    variables: sentBody,
  } = useMutation({
    mutationFn: (body: string) => sendMessage({ claimId, body }),
    // waiting for the new list keeps the message from blinking out for a moment
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // the read receipt shows under your newest message only
  const newestMineId = [...messages]
    .reverse()
    .find((message) => message.senderId === user?.id)?.id;

  // the newest message is always in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, isSending]);

  return (
    <div className="space-y-4 max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col">
      <div className="h-[50vh] max-h-[36rem] min-h-64 space-y-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-sm:h-auto max-sm:max-h-none max-sm:min-h-0 max-sm:flex-1">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="ml-auto h-12 w-1/2" />
            <Skeleton className="h-12 w-3/5" />
          </div>
        )}

        {isError && (
          <ErrorMessage
            message="Could not load the messages."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && messages.length === 0 && !isSending && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet
          </p>
        )}

        {messages.map((message) => {
          const isMine = message.senderId === user?.id;
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isMine={isMine}
              senderName={isMine ? 'You' : otherPersonName}
              receipt={
                message.id === newestMineId
                  ? message.readAt
                    ? 'Read'
                    : 'Sent'
                  : undefined
              }
            />
          );
        })}

        {isSending && sentBody !== undefined && (
          <div className="opacity-60">
            <MessageBubble
              message={{
                id: 'sending',
                claimId,
                senderId: user?.id ?? '',
                body: sentBody,
                readAt: null,
                createdAt: new Date().toISOString(),
              }}
              isMine={true}
              senderName="You"
            />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {sendFailed && sentBody !== undefined && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          <span>Message not sent. {sendError?.message}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => send(sentBody)}
          >
            Retry
          </Button>
        </div>
      )}

      {isClosed ? (
        <p className="rounded-lg bg-section p-3 text-center text-sm text-muted-foreground">
          This conversation is closed
        </p>
      ) : (
        <MessageInput onSend={send} disabled={isSending} />
      )}
    </div>
  );
};
