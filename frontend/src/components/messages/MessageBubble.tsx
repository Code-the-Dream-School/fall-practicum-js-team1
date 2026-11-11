import type { Message } from '@/types';

const timeFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

type MessageBubbleProps = {
  message: Message;
  isMine: boolean;
  senderName: string;
  // "Read" or "Sent", shown under your newest message
  receipt?: string;
};

export const MessageBubble = ({
  message,
  isMine,
  senderName,
  receipt,
}: MessageBubbleProps) => {
  return (
    <div
      className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}
    >
      <p className="text-xs text-muted-foreground">
        {senderName} · {timeFormat.format(new Date(message.createdAt))}
      </p>
      <p
        className={`max-w-[80%] whitespace-pre-wrap wrap-break-word rounded-lg px-3.5 py-2.5 text-sm ${isMine ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
      >
        {message.body}
      </p>
      {receipt && <p className="text-xs text-muted-foreground">{receipt}</p>}
    </div>
  );
};
