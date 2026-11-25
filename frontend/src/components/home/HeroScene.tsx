import sceneSvg from '@/assets/hero-scene.svg?raw';

const FLOOR_FADE =
  '<defs><linearGradient id="scene-floor-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.82" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><mask id="scene-floor-mask"><rect width="520" height="400" fill="url(#scene-floor-fade)"/></mask></defs>';

const markup = sceneSvg
  .replace(/<\?xml[^>]*\?>|<!DOCTYPE[^>]*>/g, '')
  .replace(/(<svg[^>]*>)/, `$1${FLOOR_FADE}`)
  .replace('<g id="arch">', '<g id="arch" mask="url(#scene-floor-mask)">');

export const HeroScene = ({ paused }: { paused: boolean }) => (
  <div
    aria-hidden="true"
    data-paused={paused}
    className="hero-scene mx-auto w-full max-w-104"
    dangerouslySetInnerHTML={{ __html: markup }}
  />
);
