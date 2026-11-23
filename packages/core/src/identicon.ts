import { normalizeAddress } from './address.js';

/**
 * The code a wallet's identicon is drawn from, without the address.
 *
 * Every Nimiq wallet shows the same little picture for an address: Nimiq's
 * identicons (`@nimiq/identicons`, MIT) hash the address as the wallet writes
 * it, spaced (`NQ07 0000 ...`), into a string of digits, and the first twelve
 * pick the colours and the parts. This is those twelve, so a board can show
 * somebody's identicon while the address stays on the server: the digits say
 * which picture, and nothing about which wallet.
 *
 * Changing this changes every identicon on every board, so it is part of the
 * v1 contract, like the login message.
 *
 * @example
 * identiconCode('NQ07 0000 0000 0000 0000 0000 0000 0000 0000')  // → twelve digits
 */
export function identiconCode(address: string): string {
  // The hash is a float written out, so in theory it can carry an exponent;
  // a digit stands in for anything else rather than refusing the post.
  return makeHash(spaced(address)).slice(0, 12).replace(/\D/g, '0');
}

/** Whether a string is shaped like an identicon code. */
export function isIdenticonCode(v: unknown): v is string {
  return typeof v === 'string' && /^\d{12}$/.test(v);
}

/** The spelling wallets show, and hash: groups of four, one space apart. */
function spaced(address: string): string {
  return normalizeAddress(address).replace(/(.{4})(?=.)/g, '$1 ');
}

// Ported as-is from @nimiq/identicons 1.6.2 (MIT, © 2017 Nimiq), so the
// picture matches the one in the wallet digit for digit.
function makeHash(text: string): string {
  const r = (
    '' +
    text
      .split('')
      .map((c) => Number(c.charCodeAt(0)) + 3)
      .reduce((a, e) => a * (1 - a) * chaosHash(e), 0.5)
  )
    .split('')
    .reduce((a, e) => e + a, '');
  return r.replace('.', r[5]).substr(4, 17).padEnd(13, r[5]);
}

function chaosHash(n: number): number {
  let r = 1 / n;
  for (let i = 0; i < 100; i++) r = (1 - r) * r * 3.569956786876;
  return r;
}
