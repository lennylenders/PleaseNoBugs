/**
 * A guest key for visitors of this website, who have no Nimiq wallet open.
 *
 * The browser makes an Ed25519 key of its own the first time somebody posts
 * or votes, keeps it in `localStorage`, and signs with it exactly as the
 * Keyguard would. To the server it is a Nimiq address like any other, one
 * that holds nothing and belongs to no one, so it needs no change and no
 * account. Inside Nimiq Pay the site never uses this: the wallet signs.
 *
 * **What it is not**: proof of a person. A private window or cleared site
 * data is a new key, so one vote per key is one vote per browser, and the
 * daily allowance is per browser too. The server's limits per IP address
 * are what really brake a script, and on this board nothing shows until the
 * owner approved it.
 *
 * Only on this website, never in the npm package: an app's board counts
 * wallets, and handing every app a way around that would undo it.
 *
 * Needs Ed25519 in Web Crypto (Chrome 137, Safari 17, Firefox 129 and
 * later). Where it is missing, signing fails as "no wallet" and the widget
 * says writing needs Nimiq Pay.
 */

const KEY = 'pleasenobugs.guest';
const PREFIX = '\x16Nimiq Signed Message:\n';

/**
 * A signer for `<please-no-bugs>`'s `signer` property.
 *
 * @example
 * board.signer = guestSigner();
 */
export function guestSigner(storage = safeStorage()) {
  // The promise, not the key: two boards asking at once share one key
  // instead of each making their own.
  let making = null;
  return async (message) => {
    try {
      making ??= loadOrMake(storage);
      const mine = await making;
      // What the Keyguard signs: SHA-256 over the prefixed message, its
      // length counted the way the server counts it.
      const data = new TextEncoder().encode(PREFIX + message.length + message);
      const hash = await crypto.subtle.digest('SHA-256', data);
      const signature = await crypto.subtle.sign('Ed25519', mine.privateKey, hash);
      return { address: mine.address, publicKey: hex(mine.publicKey), signature: hex(new Uint8Array(signature)) };
    } catch (e) {
      // The widget's own error, from the script-tag build, so it says that
      // writing needs a wallet instead of taking this for a "no" to signing.
      const SignerError = globalThis.PleaseNoBugs?.SignerError;
      if (SignerError) throw new SignerError('no_wallet', `No guest key: ${e?.message ?? e}`);
      throw e;
    }
  };
}

/** The key this browser already has, or a new one, remembered. */
async function loadOrMake(storage) {
  try {
    const saved = JSON.parse(storage?.getItem(KEY) ?? 'null');
    if (saved?.jwk) {
      const privateKey = await crypto.subtle.importKey('jwk', saved.jwk, { name: 'Ed25519' }, false, ['sign']);
      const publicKey = fromBase64Url(saved.jwk.x);
      return { privateKey, publicKey, address: await nimiqAddress(publicKey) };
    }
  } catch {
    // A key that no longer reads is replaced: it only ever signed feedback.
  }
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const publicKey = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  try {
    storage?.setItem(KEY, JSON.stringify({ jwk }));
  } catch {
    // Private mode: a key for this visit only.
  }
  return { privateKey: pair.privateKey, publicKey, address: await nimiqAddress(publicKey) };
}

/**
 * The Nimiq address of an Ed25519 public key, spaced as wallets write it:
 * the first 20 bytes of its BLAKE2b-256 hash, in Nimiq's base32, after "NQ"
 * and two IBAN check digits.
 */
export async function nimiqAddress(publicKey) {
  const bytes = blake2b(publicKey, 32).slice(0, 20);
  const alphabet = '0123456789ABCDEFGHJKLMNPQRSTUVXY';
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  let base32 = '';
  for (let i = 0; i < bits.length; i += 5) base32 += alphabet[parseInt(bits.slice(i, i + 5), 2)];
  const check = String(98 - ibanMod97(`${base32}NQ00`)).padStart(2, '0');
  return `NQ${check}${base32}`.replace(/.{4}/g, '$& ').trim();
}

/** The IBAN remainder: letters as 10..35, taken six digits at a time. */
function ibanMod97(s) {
  const digits = [...s].map((c) => (/\d/.test(c) ? c : String(c.charCodeAt(0) - 55))).join('');
  let rest = '';
  for (let i = 0; i < digits.length; i += 6) rest = String(Number(rest + digits.slice(i, i + 6)) % 97);
  return Number(rest);
}

// ---- BLAKE2b (RFC 7693), unkeyed, for the one hash an address needs ----

const MASK = (1n << 64n) - 1n;
const IV = [
  0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
  0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n,
];
const SIGMA = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
  [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
  [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
  [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
  [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
  [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
  [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
  [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
  [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
];
const rotr = (x, n) => ((x >> n) | (x << (64n - n))) & MASK;

/**
 * BLAKE2b of `input`, `outLen` bytes long. BigInt rather than 32-bit halves:
 * slower, but it hashes one 32-byte key per visitor, and it is short enough
 * to check against the RFC by eye.
 */
export function blake2b(input, outLen) {
  const h = IV.slice();
  h[0] ^= 0x01010000n ^ BigInt(outLen);
  const blocks = Math.max(1, Math.ceil(input.length / 128));
  for (let b = 0; b < blocks; b++) {
    const chunk = new Uint8Array(128);
    chunk.set(input.subarray(b * 128, b * 128 + 128));
    const m = [];
    for (let i = 0; i < 16; i++) {
      let w = 0n;
      for (let j = 7; j >= 0; j--) w = (w << 8n) | BigInt(chunk[i * 8 + j]);
      m.push(w);
    }
    const last = b === blocks - 1;
    const t = BigInt(last ? input.length : (b + 1) * 128);
    const v = [...h, ...IV];
    v[12] ^= t & MASK;
    if (last) v[14] ^= MASK;
    const g = (a, bb, c, d, x, y) => {
      v[a] = (v[a] + v[bb] + x) & MASK;
      v[d] = rotr(v[d] ^ v[a], 32n);
      v[c] = (v[c] + v[d]) & MASK;
      v[bb] = rotr(v[bb] ^ v[c], 24n);
      v[a] = (v[a] + v[bb] + y) & MASK;
      v[d] = rotr(v[d] ^ v[a], 16n);
      v[c] = (v[c] + v[d]) & MASK;
      v[bb] = rotr(v[bb] ^ v[c], 63n);
    };
    for (let r = 0; r < 12; r++) {
      const s = SIGMA[r % 10];
      g(0, 4, 8, 12, m[s[0]], m[s[1]]);
      g(1, 5, 9, 13, m[s[2]], m[s[3]]);
      g(2, 6, 10, 14, m[s[4]], m[s[5]]);
      g(3, 7, 11, 15, m[s[6]], m[s[7]]);
      g(0, 5, 10, 15, m[s[8]], m[s[9]]);
      g(1, 6, 11, 12, m[s[10]], m[s[11]]);
      g(2, 7, 8, 13, m[s[12]], m[s[13]]);
      g(3, 4, 9, 14, m[s[14]], m[s[15]]);
    }
    for (let i = 0; i < 8; i++) h[i] ^= v[i] ^ v[i + 8];
  }
  const out = new Uint8Array(outLen);
  for (let i = 0; i < outLen; i++) out[i] = Number((h[i >> 3] >> BigInt(8 * (i & 7))) & 0xffn);
  return out;
}

const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

function fromBase64Url(s) {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

/** `localStorage`, or null where touching it throws. */
function safeStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
