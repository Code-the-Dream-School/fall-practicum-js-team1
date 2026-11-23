type UnreadDotProps = {
  className?: string;
};

// a small dot that says there is a message you have not read
export const UnreadDot = ({ className = '' }: UnreadDotProps) => {
  return (
    <span
      role="img"
      aria-label="Unread messages"
      className={`size-2.5 shrink-0 rounded-full bg-destructive ring-2 ring-card ${className}`}
    />
  );
};
