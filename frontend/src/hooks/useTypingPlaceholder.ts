import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const TYPE_MS = 140;
const DELETE_MS = 70;
const HOLD_MS = 2400;
const PAUSE_MS = 600;

export const useTypingPlaceholder = (
  phrases: string[],
  fallback: string,
  paused: boolean,
) => {
  const reducedMotion = usePrefersReducedMotion();
  const still = reducedMotion || paused;
  const [text, setText] = useState('');

  useEffect(() => {
    if (still) return;

    let phraseIndex = 0;
    let length = 0;
    let deleting = false;
    let timer = 0;

    const tick = () => {
      const phrase = phrases[phraseIndex] ?? '';
      length += deleting ? -1 : 1;
      setText(phrase.slice(0, length));

      let delay = deleting ? DELETE_MS : TYPE_MS;

      if (!deleting && length === phrase.length) {
        deleting = true;
        delay = HOLD_MS;
      } else if (deleting && length === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        delay = PAUSE_MS;
      }

      timer = window.setTimeout(tick, delay);
    };

    timer = window.setTimeout(tick, TYPE_MS);
    return () => window.clearTimeout(timer);
  }, [phrases, still]);

  return still ? fallback : text;
};
