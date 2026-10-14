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

const store = new MemoryStore();
await store.putProject(
  newProject({ id: 'demo', name: 'Demo app', origins: [ORIGIN], owner: WALLETS.owner.address }),
);

// A board with something on it: both kinds, every status, a reply, a name,
// votes, and one post hidden by the owner.
const key = (w) => w.address.replace(/\s+/g, '').toUpperCase();
const ago = (h) => Date.now() - h * 3_600_000;
const seed = [
  { id: 's1', author: 'bob', kind: 'idea', text: 'Dark mode please. My eyes at 2am.', at: ago(50), votes: ['alice', 'owner'], status: 'planned', reply: 'On the list for the next release.' },
  { id: 's2', author: 'alice', kind: 'bug', text: 'The camera opens black the first time, the second time it works.', at: ago(5), votes: [], status: 'open', anon: false },
  { id: 's3', author: 'bob', kind: 'idea', text: 'Let me pay in NIM with a QR code from another phone.', at: ago(200), votes: ['alice'], status: 'done', reply: 'Shipped in 1.3!' },
  { id: 's4', author: 'alice', kind: 'bug', text: 'Dutch translation cuts off the send button on small phones.', at: ago(0.2), votes: ['bob'], status: 'open', context: { version: '1.4.0', host: 'nimiq-pay' } },
  { id: 's5', author: 'bob', kind: 'idea', text: 'Push notifications when somebody answers my post.', at: ago(30), votes: [], status: 'declined', reply: 'Not possible inside Nimiq Pay yet, sorry.' },
  { id: 's6', author: 'bob', kind: 'idea', text: 'Buy cheap followers here!!!', at: ago(3), votes: [], status: 'open', hidden: true },
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
  });
  for (const v of p.votes) await store.vote('demo', p.id, key(WALLETS[v]), true);
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
