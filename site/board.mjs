/**
 * The home page's board, on this machine: a real server with the rules the
 * published one has, in memory, so trying the site never posts on the real
 * board and a restart starts over.
 *
 *   npm run build && node site/board.mjs   →   http://localhost:8790, project "site"
 *
 * Its owner is the widget demo's test wallet, whose key is in this repository
 * on purpose (`packages/widget/demo/serve.mjs`). To answer as the
 * owner in a browser, paste the line this prints into the console of the site
 * and reload: the page signs with that test key instead of the Nimiq Hub (see
 * `dev/testkey.js`). Never on the published site, whose owner is a real wallet.
 */
import { createApp, MemoryStore, newProject } from '@pleasenobugs/server';

const Nimiq = await import('@nimiq/core');
const PORT = Number(process.env.PORT) || 8790;

// The same test key as the demo's owner, as a JWK for dev/testkey.js.
const seed = 'c3'.padStart(64, '0');
const pub = Nimiq.PublicKey.derive(Nimiq.PrivateKey.fromHex(seed));
const b64u = (bytes) => Buffer.from(bytes).toString('base64url');
const jwk = { kty: 'OKP', crv: 'Ed25519', d: b64u(Buffer.from(seed, 'hex')), x: b64u(pub.serialize()) };

const store = new MemoryStore();
await store.putProject(
  newProject({
    id: 'site',
    name: 'PleaseNoBugs',
    // Any local port, since the site's server moves on when 5190 is taken.
    origins: Array.from({ length: 10 }, (_, i) => `http://localhost:${5190 + i}`),
    owner: pub.toAddress().toUserFriendlyAddress(),
    // As the published board: no screenshots, and posts show at once.
    rules: { screenshots: 'off', approve: false },
  }),
);

// Something on the board, as if approved already.
const ago = (h) => Date.now() - h * 3_600_000;
const seeded = [
  { id: 's1', kind: 'idea', text: 'A Svelte example in the README would help.', at: ago(30) },
  { id: 's2', kind: 'review', text: 'Pasted two lines and it worked inside Nimiq Pay.', at: ago(8), rating: 5 },
  { id: 's3', kind: 'bug', text: 'The configurator preview is cut off on my small phone.', at: ago(2) },
];
// Two with a name and an identicon, one anonymous, as people choose.
const names = ['Mira', undefined, 'Sam'];
for (const [i, p] of seeded.entries()) {
  const author = `NQ00SEED${i}`;
  await store.createPost({ projectId: 'site', author, anon: !names[i], status: 'open', ...p });
  if (names[i]) await store.setName('site', author, names[i]);
}

createApp({ store, postsPerIpDay: 20 }).listen(PORT, () => {
  console.log(`Local board on http://localhost:${PORT}, project "site": screenshots off, posts show at once`);
  console.log('To sign as its owner without a wallet, run this in the site\'s console and reload:');
  // The proof remembered for the old key goes too, or the board would go on
  // seeing the visitor it was before.
  console.log(
    `  localStorage.setItem('pleasenobugs.testkey', ${JSON.stringify(JSON.stringify({ jwk }))}); ` +
      `Object.keys(localStorage).filter((k) => k.startsWith('pleasenobugs.proof.')).forEach((k) => localStorage.removeItem(k))`,
  );
});
