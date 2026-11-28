/**
 * A Nimiq address in the one spelling every comparison and every stored row
 * uses: upper case, no spaces.
 *
 * Wallets hand addresses out spaced (`NQ07 0000 ...`) and people paste them
 * however they like. Comparing two spellings of one wallet as different
 * wallets is how one person gets two votes, so nothing is compared until it
 * has been through here.
 *
 * @example
 * normalizeAddress('nq07 0000 0000 0000 0000 0000 0000 0000 0000')
 * // → 'NQ070000000000000000000000000000000000'
 */
export function normalizeAddress(address: string): string {
  return address.replace(/\s+/g, '').toUpperCase();
}

/**
 * An address cut to its first and last four characters, the way a wallet
 * shows one in a list: `NQ12 … AB34`. Enough to tell two people apart on a
 * board, not enough to send anybody anything.
 *
 * What a post shows for an author who chose no name and did not post
 * anonymously (see `Post.short`).
 *
 * @example
 * shortAddress('NQ12 3456 7890 ABCD EFGH JKLM NPQR STUV AB34') // → 'NQ12 … AB34'
 */
export function shortAddress(address: string): string {
  const a = normalizeAddress(address);
  return `${a.slice(0, 4)} … ${a.slice(-4)}`;
}

/**
 * Whether a string is shaped like a Nimiq address (in any spelling). Shape
 * only: the checksum is the wallet's business, and a signature from a key
 * proves far more than a checksum could.
 */
export function isNimiqAddress(v: unknown): v is string {
  return typeof v === 'string' && /^NQ\d{2}[0-9A-Z]{32}$/.test(normalizeAddress(v));
}
