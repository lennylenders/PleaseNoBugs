import { createHash } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { describe, expect, it } from 'vitest';
import { createClient } from '../packages/widget/src/client.js';
import { newProject } from '../packages/server/src/projects.js';
import { MemoryStore } from '../packages/server/src/memory-store.js';
import { createApp } from '../packages/server/src/app.js';
// @ts-expect-error: plain JavaScript, served to browsers as it is
import { KEY, blake2b, hasTestKey, nimiqAddress, testKeySigner } from './dev/testkey.js';

/**
 * The local site's test key, checked against the things it has to agree with:
 * Node's BLAKE2b, Nimiq's own address derivation, and the real server.
 */

const Nimiq = await import('@nimiq/core');
const SITE = 'https://lennylenders.github.io';

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

/** A storage holding the test key for `seed`, the way board.mjs prints it. */
function withKey(seed: string) {
  const hexSeed = seed.padStart(64, '0');
  const pub = Nimiq.PublicKey.derive(Nimiq.PrivateKey.fromHex(hexSeed));
  const b64u = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64url');
  const jwk = { kty: 'OKP', crv: 'Ed25519', d: b64u(Buffer.from(hexSeed, 'hex')), x: b64u(pub.serialize()) };
  const s = memoryStorage();
  s.setItem(KEY, JSON.stringify({ jwk }));
  return { storage: s, address: pub.toAddress().toUserFriendlyAddress() };
}

describe('the test key', () => {
  it('hashes like BLAKE2b', () => {
    for (const input of ['', 'abc', 'x'.repeat(300)]) {
      const bytes = new TextEncoder().encode(input);
      const ours = Buffer.from(blake2b(bytes, 64)).toString('hex');
      expect(ours).toBe(createHash('blake2b512').update(bytes).digest('hex'));
    }
  });

  it('spells the address of a key exactly as Nimiq does', async () => {
    for (const seed of ['a1', 'b2', 'c3', 'ff']) {
      const pub = Nimiq.PublicKey.derive(Nimiq.PrivateKey.fromHex(seed.padStart(64, '0')));
      expect(await nimiqAddress(pub.serialize())).toBe(pub.toAddress().toUserFriendlyAddress());
    }
  });

  it('is never made up: without one stored, there is none', async () => {
    const empty = memoryStorage();
    expect(hasTestKey(empty)).toBe(false);
    await expect(testKeySigner(empty)('hello')).rejects.toThrow();
    expect(empty.getItem(KEY)).toBeNull();
  });

  it('posts and votes on a real server as the wallet it belongs to', async () => {
    const store = new MemoryStore();
    await store.putProject(newProject({ id: 'site', name: 'PleaseNoBugs', origins: [SITE], owner: 'NQ07 0000 0000 0000 0000 0000 0000 0000 0000' }));
    const server = createApp({ store }).listen(0);
    await new Promise<void>((r) => server.once('listening', () => r()));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      const { storage, address } = withKey('c3');
      expect(hasTestKey(storage)).toBe(true);
      const client = (proofs: ReturnType<typeof memoryStorage>) =>
        createClient({ server: url, project: 'site', origin: SITE, signer: testKeySigner(storage), storage: proofs });

      const first = client(memoryStorage());
      const posted = await first.post({ id: 'g1', kind: 'idea', text: 'A test wish' });
      expect(posted).toMatchObject({ ok: true });
      expect(first.address()).toBe(address.replace(/ /g, ''));

      // A new visit: no proof remembered, but the same key, so the post is still "mine".
      const again = client(memoryStorage());
      expect(await again.vote('g1', true)).toMatchObject({ ok: true });
      const board = await again.board();
      expect(board.ok && board.data.posts[0]).toMatchObject({ id: 'g1', mine: true, voted: true, votes: 1 });
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });
});
