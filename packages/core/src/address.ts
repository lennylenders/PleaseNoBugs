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
 * Whether a string is shaped like a Nimiq address (in any spelling). Shape
 * only: the checksum is the wallet's business, and a signature from a key
 * proves far more than a checksum could.
 */
export function isNimiqAddress(v: unknown): v is string {
  return typeof v === 'string' && /^NQ\d{2}[0-9A-Z]{32}$/.test(normalizeAddress(v));
}
