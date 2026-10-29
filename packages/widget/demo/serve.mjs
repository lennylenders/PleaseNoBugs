/**
 * The widget, the server and a page to look at them on, in one process.
 *
 *   npm run build && node packages/widget/demo/serve.mjs   →   http://localhost:5180
 *
 * **Demo only: it signs on the user's behalf.** `/demo/sign` holds three test
 * keys and signs whatever it is asked, which is what lets every state of the
 * board be tried in a desktop browser with no wallet and no second phone. It
 * exists in this file and nowhere in any package, and it must stay that way.
 */
import express from 'express';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createApp, MemoryStore, newProject, signedHash } from '@pleasenobugs/server';

const Nimiq = await import('@nimiq/core');
const PORT = Number(process.env.PORT) || 5180;
const ORIGIN = `http://localhost:${PORT}`;
const here = (p) => fileURLToPath(new URL(p, import.meta.url));

/** Three throwaway wallets, fixed so a reload keeps who is who. */
const WALLETS = Object.fromEntries(
  Object.entries({ alice: 'a1', bob: 'b2', owner: 'c3' }).map(([who, seed]) => {
    const priv = Nimiq.PrivateKey.fromHex(seed.padStart(64, '0'));
    const pub = Nimiq.PublicKey.derive(priv);
    return [who, { priv, pub, address: pub.toAddress().toUserFriendlyAddress() }];
  }),
);

// Other apps on this machine that may use the demo board, e.g. an app's own
// dev server trying the widget: DEMO_ORIGINS=http://localhost:5173
const EXTRA = (process.env.DEMO_ORIGINS ?? 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean);

const store = new MemoryStore();
await store.putProject(
  newProject({
    id: 'demo',
    name: 'Demo app',
    origins: [ORIGIN, ...EXTRA],
    owner: WALLETS.owner.address,
    loginMessages: ['Sign in to Shitti'],
  }),
);

// A board with something on it: every kind, every status, a reply, a name,
// votes, reviews, a bug with a screenshot on the board, an idea with one kept
// for the owner, and one post hidden by the owner.
const key = (w) => w.address.replace(/\s+/g, '').toUpperCase();
const ago = (h) => Date.now() - h * 3_600_000;
const seed = [
  { id: 's1', author: 'bob', kind: 'idea', text: 'Dark mode please. My eyes at 2am.', at: ago(50), votes: ['alice', 'owner'], status: 'planned', reply: 'On the list for the next release.' },
  { id: 's2', author: 'alice', kind: 'bug', text: 'The camera opens black the first time, the second time it works.', at: ago(5), votes: [], status: 'open', anon: false },
  { id: 's3', author: 'bob', kind: 'idea', text: 'Let me pay in NIM with a QR code from another phone.', at: ago(200), votes: ['alice'], status: 'done', reply: 'Shipped in 1.3!' },
  { id: 's4', author: 'alice', kind: 'bug', text: 'Dutch translation cuts off the send button on small phones.', at: ago(0.2), votes: ['bob'], status: 'open', context: { version: '1.4.0', host: 'nimiq-pay' } },
  { id: 's5', author: 'bob', kind: 'idea', text: 'Push notifications when somebody answers my post.', at: ago(30), votes: [], status: 'declined', reply: 'Not possible inside Nimiq Pay yet, sorry.' },
  { id: 's6', author: 'bob', kind: 'idea', text: 'Buy cheap followers here!!!', at: ago(3), votes: [], status: 'open', hidden: true },
  { id: 's7', author: 'alice', kind: 'review', rating: 5, text: 'Paying at the market with a QR code is so quick. Love it.', at: ago(20), votes: ['bob'], status: 'open', anon: false },
  { id: 's8', author: 'bob', kind: 'review', rating: 4, text: 'Great app, but the first load is slow on my old phone.', at: ago(70), votes: [], status: 'open', reply: 'Thank you! Working on the load time.' },
  { id: 's9', author: 'owner', kind: 'bug', text: 'My balance shows 0 after switching accounts.', at: ago(1), votes: [], status: 'open', shot: 'board', context: { version: '1.4.0', host: 'browser' } },
  { id: 's10', author: 'alice', kind: 'idea', text: 'Show the fee before I confirm, like in this screenshot.', at: ago(8), votes: [], status: 'open', shot: 'owners' },
];
await store.setName('demo', key(WALLETS.alice), 'Alice');
for (const p of seed) {
  await store.createPost({
    projectId: 'demo',
    id: p.id,
    author: key(WALLETS[p.author]),
    anon: p.anon !== false,
    kind: p.kind,
    text: p.text,
    at: p.at,
    status: p.status,
    ...(p.reply ? { reply: { text: p.reply, at: p.at + 3_600_000 }, answeredAt: p.at + 3_600_000 } : {}),
    ...(p.hidden ? { hidden: true } : {}),
    ...(p.context ? { context: p.context } : {}),
    ...(p.rating ? { rating: p.rating } : {}),
  }, p.shot ? { type: 'image/png', data: fakeScreenshot(), board: p.shot === 'board' } : undefined);
  for (const v of p.votes) await store.vote('demo', p.id, key(WALLETS[v]), true);
}

/**
 * A made-up phone screenshot for the seeded bug: a header, a big "balance"
 * block and some rows, as a real PNG, so the owner's sheet has a picture to
 * show without the repository carrying one.
 */
function fakeScreenshot(w = 270, h = 480) {
  const px = Buffer.alloc((w * 3 + 1) * h);
  const paint = (x0, y0, x1, y1, [r, g, b]) => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) px.set([r, g, b], y * (w * 3 + 1) + 1 + x * 3);
  };
  paint(0, 0, w, h, [246, 246, 248]);
  paint(0, 0, w, 56, [31, 35, 72]);
  paint(20, 84, w - 20, 184, [255, 255, 255]);
  paint(80, 112, w - 80, 156, [217, 68, 50]);
  for (let i = 0; i < 5; i++) paint(20, 212 + i * 52, w - 20, 252 + i * 52, [232, 232, 239]);
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc(body), body.length + 4);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  return new Uint8Array(
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(px)),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

const app = express();
app.use(express.json());

// The fake wallet. Demo only (see the top of this file).
app.post('/demo/sign', (req, res) => {
  const w = WALLETS[req.body?.who];
  if (!w || typeof req.body?.message !== 'string') return res.status(400).json({ error: 'bad_request' });
  const sig = Nimiq.Signature.create(w.priv, w.pub, signedHash(req.body.message));
  res.json({ address: w.address, publicKey: w.pub.toHex(), signature: sig.toHex() });
});

app.use('/dist', express.static(here('../dist')));
app.get('/', (_req, res) => res.sendFile(here('./index.html')));
app.use(createApp({ store }));

app.listen(PORT, () => console.log(`[demo] ${ORIGIN}  (project "demo", owner is the "owner" wallet)`));
