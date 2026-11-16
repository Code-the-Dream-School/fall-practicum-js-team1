import { useEffect } from 'react';

// When the keyboard opens, iOS scrolls the whole page to bring the message box into view,
// and it does not scroll back. The page position is saved when the conversation opens
// and put back when it closes.
export const useRestoreScroll = () => {
  useEffect(() => {
    const scrollY = window.scrollY;

    return () => {
      const restore = () =>
        window.scrollTo({ top: scrollY, behavior: 'instant' });
      restore();
      window.setTimeout(restore, 350);
    };
  }, []);
};
