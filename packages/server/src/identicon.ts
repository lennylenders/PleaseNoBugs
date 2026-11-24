import { createRequire } from 'node:module';
import { isIdenticonCode } from '@pleasenobugs/core';

/**
 * Draws a wallet's identicon from its code (see `identiconCode` in core).
 *
 * Here and not in the widget: Nimiq's identicons carry 88 kB of drawings, more
 * than the whole widget, and a widget in somebody's app should not grow by
 * that or fetch it from a third party. The server already answers the widget,
 * so the picture comes from the same place as the board, once per code, and
 * the browser keeps it.
 *
 * `_svgTemplate` is the library's own drawing step, the one `svg(address)`
 * ends in; it takes the digits instead of the address, which is the point.
 * Not public API, so the version is pinned exactly and a test compares it
 * with `svg(address)`.
 */
const Identicons = loadIdenticons();

/** Pictures drawn so far. Bounded: a code is twelve digits, a cache is not a database. */
const drawn = new Map<string, string>();
const KEEP = 2000;

/** The SVG for a code, or null when it is not one. */
export async function identiconSvg(code: string): Promise<string | null> {
  if (!isIdenticonCode(code)) return null;
  const known = drawn.get(code);
  if (known) return known;
  const d = code.split('');
  const svg: string = await Identicons._svgTemplate(d[0], d[2], d[3] + d[4], d[5] + d[6], d[7] + d[8], d[9] + d[10], d[11]);
  if (drawn.size >= KEEP) drawn.delete(drawn.keys().next().value as string);
  drawn.set(code, svg);
  return svg;
}

interface IdenticonsClass {
  svg(text: string): Promise<string>;
  _svgTemplate(...parts: string[]): Promise<string>;
}

function loadIdenticons(): IdenticonsClass {
  const mod = createRequire(import.meta.url)('@nimiq/identicons') as { default: IdenticonsClass };
  return mod.default;
}

/** For the test that keeps `_svgTemplate` honest. */
export const identiconsLibrary = Identicons;
