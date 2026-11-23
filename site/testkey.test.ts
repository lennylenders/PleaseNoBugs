import { createHash } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { describe, expect, it } from 'vitest';
import { createClient } from '../packages/widget/src/client.js';
import { newProject } from '../packages/server/src/projects.js';
import { MemoryStore } from '../packages/server/src/memory-store.js';
import { createApp } from '../packages/server/src/app.js';
// @ts-expect-error: plain JavaScript, served to browsers as it is
import { blake2b, guestSigner, nimiqAddress } from './src/assets/guest.js';

/**
 * The website's guest key, checked against the things it has to agree with:
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

describe('the guest key', () => {
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

  it('posts and votes on a real server, and stays the same key on the next visit', async () => {
    const store = new MemoryStore();
    await store.putProject(newProject({ id: 'site', name: 'PleaseNoBugs', origins: [SITE], owner: 'NQ07 0000 0000 0000 0000 0000 0000 0000 0000' }));
    const server = createApp({ store }).listen(0);
    await new Promise<void>((r) => server.once('listening', () => r()));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      const storage = memoryStorage();
      const client = (proofs: ReturnType<typeof memoryStorage>) =>
        createClient({ server: url, project: 'site', origin: SITE, signer: guestSigner(storage), storage: proofs });

      const first = client(memoryStorage());
      const posted = await first.post({ id: 'g1', kind: 'idea', text: 'A guest wish' });
      expect(posted).toMatchObject({ ok: true });

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
