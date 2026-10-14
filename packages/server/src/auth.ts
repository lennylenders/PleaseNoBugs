import { createHash } from 'node:crypto';
import {
  decodeProof,
  isNimiqAddress,
  loginMessage,
  normalizeAddress,
  normalizeOrigin,
  proofIsFresh,
} from '@pleasenobugs/core';

/**
 * Who is asking, proven by a Nimiq wallet signature.
 *
 * The Keyguard, which sits behind both Nimiq Pay and the Nimiq Hub, never signs
 * a message's bytes directly: to stop a signed message ever doubling as a
 * transaction it signs `SHA256("\x16Nimiq Signed Message:\n" + length + message)`.
 * We rebuild exactly those bytes and check the Ed25519 signature against them.
 *
 * What makes this different from a single-app login is what goes *into* the
 * message: the project and the origin (see `loginMessage` in core). The project
 * comes from the URL, never from the proof, so a proof can only ever be checked
 * against the board it was written for.
 */

const MSG_PREFIX = '\x16Nimiq Signed Message:\n';

let nimiqPromise: Promise<typeof import('@nimiq/core')> | null = null;
/** Loaded on first use: it is WebAssembly, and a server that never sees a
 *  proof (tests of the public routes, a health check) has no need of it. */
function loadNimiq() {
  if (!nimiqPromise) nimiqPromise = import('@nimiq/core');
  return nimiqPromise;
}

/** The 32-byte hash the Keyguard actually signs for `message`. */
export function signedHash(message: string): Uint8Array {
  const data = MSG_PREFIX + message.length + message;
  return new Uint8Array(createHash('sha256').update(Buffer.from(data, 'utf8')).digest());
}

/**
 * Whether `signatureHex` signs `message` under `publicKeyHex`, and that key
 * controls `address`. Never throws: anything malformed is simply false.
 */
export async function verifySignature(
  message: string,
  address: string,
  publicKeyHex: string,
  signatureHex: string,
): Promise<boolean> {
  try {
    const Nimiq = await loadNimiq();
    const pub = Nimiq.PublicKey.fromHex(publicKeyHex);
    const sig = Nimiq.Signature.fromHex(signatureHex);
    if (!pub.verify(sig, signedHash(message))) return false;
    return normalizeAddress(pub.toAddress().toUserFriendlyAddress()) === normalizeAddress(address);
  } catch {
    return false;
  }
}

export type ProofCheck =
  | { ok: true; address: string; origin: string }
  /** `missing`: no header at all, which on a public route means a stranger.
   *  `invalid`: a header that does not hold up, which is always a refusal. */
  | { ok: false; reason: 'missing' | 'invalid' };

/**
 * Proofs already verified, by the exact header and project. The widget polls,
 * and an Ed25519 check per request per poll is work with no new answer in it.
 * Freshness is still checked every time, so a cached proof expires on schedule.
 * Bounded, oldest out, so a flood of junk headers cannot grow it.
 */
const verified = new Map<string, string>();
const CACHE_MAX = 10_000;

/**
 * Check an `Authorization` header against one project.
 *
 * @param header         the raw `Authorization` header
 * @param project        the project id from the URL, or `DASHBOARD_PROJECT`
 * @param requestOrigin  the request's `Origin` header, when it has one
 *
 * Whether the origin is one the project *allows* is deliberately not decided
 * here: that failure deserves its own error (`origin_not_allowed`), and this
 * function knows nothing about projects.
 *
 * @example
 * const check = await checkProof(req.header('authorization'), 'k7q2m9xw4p', req.header('origin'));
 * if (check.ok) console.log(check.address, check.origin);
 */
export async function checkProof(
  header: string | undefined,
  project: string,
  requestOrigin: string | undefined,
  now: number = Date.now(),
): Promise<ProofCheck> {
  if (!header) return { ok: false, reason: 'missing' };
  const proof = decodeProof(header);
  if (!proof || !isNimiqAddress(proof.address) || !proofIsFresh(proof.issued, now)) {
    return { ok: false, reason: 'invalid' };
  }
  const origin = normalizeOrigin(proof.origin);
  // A browser always says where a cross-origin request comes from, and a page
  // cannot lie about it. A proof signed for one site and replayed from another
  // fails here even before the signature is checked.
  if (requestOrigin && normalizeOrigin(requestOrigin) !== origin) {
    return { ok: false, reason: 'invalid' };
  }

  const address = normalizeAddress(proof.address);
  const key = `${project}|${header}`;
  if (verified.get(key) === address) return { ok: true, address, origin };

  const message = loginMessage({ project, origin, issued: proof.issued });
  if (!(await verifySignature(message, address, proof.publicKey, proof.signature))) {
    return { ok: false, reason: 'invalid' };
  }
  if (verified.size >= CACHE_MAX) {
    const oldest = verified.keys().next().value;
    if (oldest !== undefined) verified.delete(oldest);
  }
  verified.set(key, address);
  return { ok: true, address, origin };
}
