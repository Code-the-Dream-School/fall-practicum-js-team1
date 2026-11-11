import { useEffect } from 'react';

// On a phone the keyboard covers the page but the page does not shrink, so a dialog sized with vh
// ends up behind the keyboard. The visual viewport is the part of the screen you can really see,
// so its height and top are put in two CSS variables that the conversation dialog uses on phones.
export const useVisualViewport = () => {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const root = document.documentElement;
    const update = () => {
      root.style.setProperty('--vvh', `${viewport.height}px`);
      root.style.setProperty('--vvt', `${viewport.offsetTop}px`);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      root.style.removeProperty('--vvh');
      root.style.removeProperty('--vvt');
    };
  }, []);
};
