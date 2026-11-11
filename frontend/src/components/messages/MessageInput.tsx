import { useLayoutEffect, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';

const MAX_LENGTH = 2000;
const SHOW_COUNTER_FROM = 1800;

type MessageInputProps = {
  onSend: (body: string) => void;
  disabled?: boolean;
};

export const MessageInput = ({
  onSend,
  disabled = false,
}: MessageInputProps) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = text.trim();
  const canSend =
    !disabled && trimmed.length >= 1 && trimmed.length <= MAX_LENGTH;

  // the box grows with the text, up to its max height. This works in every browser, CSS field-sizing does not yet
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [text]);

  const send = () => {
    if (!canSend) return;
    onSend(trimmed);
    setText('');
    // the keyboard stays open, so the next message can be typed right away
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // on a phone or tablet (touch screen) Enter adds a new line and only the send button sends
    const isTouchScreen = window.matchMedia('(pointer: coarse)').matches;
    if (e.key === 'Enter' && !e.shiftKey && !isTouchScreen) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div>
      {/* the box is the border, so the send button sits inside the text input. It starts with one line and grows while you type */}
      <div className="flex items-end gap-2 rounded-lg border border-input p-1.5 pl-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <textarea
          ref={textareaRef}
          aria-label="Message"
          rows={1}
          maxLength={MAX_LENGTH}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          title="Enter sends, Shift+Enter adds a new line"
          className="max-h-32 max-sm:max-h-24 min-h-9 w-full resize-none bg-transparent [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1.5 text-base outline-none sm:text-sm"
        />
        <Button
          type="button"
          size="icon"
          aria-label="Send message"
          title="Send message"
          className="size-10 shrink-0 sm:size-8"
          onClick={send}
          disabled={!canSend}
        >
          <SendHorizontal />
        </Button>
      </div>
      {text.length >= SHOW_COUNTER_FROM && (
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {text.length}/{MAX_LENGTH}
        </p>
      )}
    </div>
  );
};
