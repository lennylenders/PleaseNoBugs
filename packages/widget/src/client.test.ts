import { afterEach, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { createApp } from '../../server/src/app.js';
import { MemoryStore } from '../../server/src/memory-store.js';
import { newProject } from '../../server/src/projects.js';
import { wallet } from '../../server/src/test-helpers.js';
import { signedHash } from '../../server/src/auth.js';
import { createClient } from './client.js';
import type { Signer } from './signer.js';
import { SignerError } from './signer.js';

/**
 * The client against the real server, with real signatures. This is the seam
 * the widget lives on, so it is tested end to end rather than against a mock
 * of a server that might not agree with the real one.
 */

const APP = 'https://app.example';
const OWNER = wallet('c3');

const Nimiq = await import('@nimiq/core');

/** A signer the way Nimiq Pay would be one, counting how often it was asked. */
function signerFor(seed: string) {
  const priv = Nimiq.PrivateKey.fromHex(seed.padStart(64, '0'));
  const pub = Nimiq.PublicKey.derive(priv);
  let asked = 0;
  const sign: Signer = async (message) => {
    asked++;
    const sig = Nimiq.Signature.create(priv, pub, signedHash(message));
    return { address: pub.toAddress().toUserFriendlyAddress(), publicKey: pub.toHex(), signature: sig.toHex() };
  };
  return { sign, asked: () => asked };
}

/** A storage that is just a map, to check what survives a "reload". */
function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

let stop: (() => void) | null = null;
afterEach(() => {
  stop?.();
  stop = null;
});

async function server() {
  const store = new MemoryStore();
  await store.putProject(newProject({ id: 'board1', name: 'Board', origins: [APP], owner: OWNER.address }));
  const srv = createApp({ store }).listen(0);
  await new Promise<void>((r) => srv.once('listening', () => r()));
  stop = () => srv.close();
  return { url: `http://127.0.0.1:${(srv.address() as AddressInfo).port}`, store };
}

describe('createClient', () => {
  it('reads without asking the wallet', async () => {
    const { url } = await server();
    const s = signerFor('a1');
    const client = createClient({ server: url, project: 'board1', origin: APP, signer: s.sign, storage: null });
    const board = await client.board();
    expect(board.ok && board.data.posts).toEqual([]);
    expect(board.ok && board.data.me).toBeUndefined();
    expect(s.asked()).toBe(0);
  });

  it('asks once on the first write, then remembers across a reload', async () => {
    const { url } = await server();
    const s = signerFor('a1');
    const storage = memoryStorage();
    const make = () => createClient({ server: url, project: 'board1', origin: APP, signer: s.sign, storage });

    const first = make();
    expect((await first.post({ id: 'p1', kind: 'idea', text: 'Dark mode' })).ok).toBe(true);
    expect((await first.vote('p1', false)).ok).toBe(true);
    expect(s.asked()).toBe(1);

    const reloaded = make();
    const board = await reloaded.board();
    expect(board.ok && board.data.me?.left).toBe(4);
    expect(board.ok && board.data.posts[0].mine).toBe(true);
    expect(s.asked()).toBe(1);
  });

  it('shares one prompt between two taps', async () => {
    const { url } = await server();
    const s = signerFor('a1');
    const client = createClient({ server: url, project: 'board1', origin: APP, signer: s.sign, storage: null });
    await Promise.all([
      client.post({ id: 'p1', kind: 'idea', text: 'One' }),
      client.post({ id: 'p2', kind: 'idea', text: 'Two' }),
    ]);
    expect(s.asked()).toBe(1);
  });

  it('signs again, once, when a stored proof stops working', async () => {
    const { url } = await server();
    const s = signerFor('a1');
    const storage = memoryStorage();
    const key = `pleasenobugs.proof.board1.${APP}`;
    const client = createClient({ server: url, project: 'board1', origin: APP, signer: s.sign, storage });
    await client.post({ id: 'p1', kind: 'idea', text: 'Dark mode' });

    // A stored proof the server no longer accepts.
    const stored = JSON.parse(storage.getItem(key)!);
    storage.setItem(key, JSON.stringify({ ...stored, signature: '00'.repeat(64) }));

    const reloaded = createClient({ server: url, project: 'board1', origin: APP, signer: s.sign, storage });
    expect((await reloaded.vote('p1', true)).ok).toBe(true);
    expect(s.asked()).toBe(2);
  });

  it('reads as a stranger when a stored proof stops working, without prompting', async () => {
    const { url } = await server();
    const s = signerFor('a1');
    const storage = memoryStorage();
    storage.setItem(
      `pleasenobugs.proof.board1.${APP}`,
      JSON.stringify({ address: OWNER.address, publicKey: 'aa', signature: 'bb', origin: APP, issued: Date.now() }),
    );
    const client = createClient({ server: url, project: 'board1', origin: APP, signer: s.sign, storage });
    const board = await client.board();
    expect(board.ok).toBe(true);
    expect(s.asked()).toBe(0);
    expect(client.address()).toBeNull();
  });

  it('says there is no wallet, rather than failing, outside Nimiq Pay with no signer', async () => {
    const { url } = await server();
    const client = createClient({ server: url, project: 'board1', origin: APP, storage: null });
    expect(client.canSign).toBe(false);
    expect(await client.post({ id: 'x', kind: 'idea', text: 'hi' })).toMatchObject({ ok: false, error: 'no_signer' });
  });

  it('reports a declined signature as declined', async () => {
    const { url } = await server();
    const client = createClient({
      server: url,
      project: 'board1',
      origin: APP,
      storage: null,
      signer: async () => {
        throw new SignerError('declined');
      },
    });
    expect(await client.vote('x', true)).toMatchObject({ ok: false, error: 'declined' });
  });

  it('passes the server’s refusals through, with their body', async () => {
    const { url } = await server();
    const s = signerFor('a1');
    const client = createClient({ server: url, project: 'board1', origin: APP, signer: s.sign, storage: null });
    for (let i = 0; i < 5; i++) await client.post({ id: `p${i}`, kind: 'idea', text: `Post ${i}` });
    const sixth = await client.post({ id: 'p6', kind: 'idea', text: 'One too many' });
    expect(sixth).toMatchObject({ ok: false, status: 429, error: 'too_many', body: { perDay: 5 } });
  });

  it('answers network when there is no server', async () => {
    const client = createClient({ server: 'http://127.0.0.1:1', project: 'board1', origin: APP, storage: null });
    expect(await client.board()).toMatchObject({ ok: false, error: 'network' });
  });
});
