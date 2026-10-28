import type { AddressInfo } from 'node:net';
import { encodeProof, loginMessage, normalizeAddress } from '@pleasenobugs/core';
import { createApp, type AppOptions } from './app.js';
import { signedHash } from './auth.js';

const Nimiq = await import('@nimiq/core');

/**
 * A throwaway wallet that signs real proofs, the same bytes Nimiq Pay and the
 * Hub would produce. Nothing in these tests fakes a signature: a check that
 * only ever met forgeries would prove nothing about the real ones.
 *
 * @example
 * const alice = wallet('a1');
 * alice.proof('myproject', 'https://my.app')   // → 'Nimiq eyJ...'
 */
export function wallet(seed: string) {
  const priv = Nimiq.PrivateKey.fromHex(seed.padStart(64, '0'));
  const pub = Nimiq.PublicKey.derive(priv);
  const address = pub.toAddress().toUserFriendlyAddress();
  return {
    /** As a wallet spells it, spaced. */
    address,
    /** As the server stores it. */
    key: normalizeAddress(address),
    proof(project: string, origin: string, issued: number = Date.now()) {
      const sig = Nimiq.Signature.create(priv, pub, signedHash(loginMessage({ project, origin, issued })));
      return encodeProof({ address, publicKey: pub.toHex(), signature: sig.toHex(), origin, issued });
    },
    /** The app's own login, signed over a fixed message. */
    appLogin(message: string) {
      const sig = Nimiq.Signature.create(priv, pub, signedHash(message));
      return { address, publicKey: pub.toHex(), signature: sig.toHex(), message };
    },
    /** That app login as an `Authorization` header, from `origin`. */
    appProof(message: string, origin: string) {
      return encodeProof({ ...this.appLogin(message), origin, issued: 0 });
    },
  };
}

export type Wallet = ReturnType<typeof wallet>;

/** A real server on a free port, and a `call` that talks to it. */
export async function serve(options: AppOptions) {
  const server = createApp(options).listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  async function call(
    method: string,
    path: string,
    opts: { auth?: string; origin?: string; body?: unknown } = {},
  ): Promise<{ status: number; data: any; raw: string; type: string | null; bytes: number }> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (opts.auth) headers.authorization = opts.auth;
    if (opts.origin) headers.origin = opts.origin;
    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
    });
    const buf = new Uint8Array(await res.arrayBuffer());
    const raw = new TextDecoder().decode(buf);
    let data: any = null;
    try {
      data = JSON.parse(raw);
    } catch {
      // Left null: a test that expected JSON fails on its own assertion.
    }
    return { status: res.status, data, raw, type: res.headers.get('content-type'), bytes: buf.length };
  }

  return { call, close: () => new Promise<void>((r) => server.close(() => r())) };
}
