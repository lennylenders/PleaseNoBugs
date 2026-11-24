import { useState } from 'preact/hooks';

/**
 * A wallet's identicon, from the code a post carries in `face`.
 *
 * The picture comes from the board's own server (`/v1/identicons/:code.svg`),
 * which draws it once and lets the browser keep it: Nimiq's drawings weigh
 * more than this whole widget. Until it arrives, and where there is no server
 * to ask (the demo), a hexagon in the identicon's own background colour
 * stands in, so the space never jumps and the colour already matches.
 *
 * Decorative: the name beside it says who, so it is hidden from screen readers.
 */
export function Face({ code, src, size = 20 }: { code?: string; src?: string; size?: number }) {
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);
  const fill = code ? BACKGROUNDS[Number(code[2]) % 10] : 'var(--pnb-line)';
  return (
    <span class="face" style={{ width: `${size}px`, height: `${size}px` }} aria-hidden="true">
      {!loaded && (
        <svg class="face__stand-in" viewBox="0 0 160 160" width={size} height={size}>
          <path fill={fill} d={HEXAGON} />
        </svg>
      )}
      {src && !broken && (
        <img
          class={`face__img${loaded ? '' : ' face__img--loading'}`}
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setBroken(true)}
        />
      )}
    </span>
  );
}

/** The identicons' hexagon, from the clip path they are drawn in. */
const HEXAGON =
  'M125.8 16.67l31.77 55.01c2.86 4.95 2.86 11.05 0 16L125.8 142.7c-2.85 4.95-8.14 8-13.85 8H48.42c-5.72 0-11-3.05-13.85-8L2.8 87.69c-2.85-4.95-2.85-11.05 0-16L34.57 16.67c2.86-4.95 8.14-8 13.85-8h63.53c5.72 0 11 3.05 13.85 8z';

/** The background colours Nimiq's identicons pick from, by the code's third digit. */
const BACKGROUNDS = ['#FC8702', '#D94432', '#E9B213', '#1F2348', '#0582CA', '#5F4B8B', '#21BCA5', '#FA7268', '#88B04B', '#795548'];
