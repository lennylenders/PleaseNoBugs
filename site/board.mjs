/**
 * The home page's board, on this machine: a real server with the rules the
 * published one has, in memory, so trying the site never posts on the real
 * board and a restart starts over.
 *
 *   npm run build && node site/board.mjs   →   http://localhost:8790, project "site"
 *
 * Its owner is the widget demo's test wallet, whose key is in this repository
 * on purpose (`packages/widget/demo/serve.mjs`). To answer and approve as the
 * owner in a browser, paste the line this prints into the console of the site
 * and reload: the page's guest key becomes that test key. Never on the
 * published site, whose owner is a real wallet.
 */
import { createApp, MemoryStore, newProject } from '@pleasenobugs/server';

const Nimiq = await import('@nimiq/core');
const PORT = Number(process.env.PORT) || 8790;

// The same test key as the demo's owner, as the guest key's JWK.
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
    rules: { screenshots: 'off', approve: true },
  }),
);

// Something on the board, as if approved already.
const ago = (h) => Date.now() - h * 3_600_000;
const seeded = [
  { id: 's1', kind: 'idea', text: 'A Svelte example in the README would help.', at: ago(30) },
  { id: 's2', kind: 'review', text: 'Pasted two lines and it worked inside Nimiq Pay.', at: ago(8), rating: 5 },
  { id: 's3', kind: 'bug', text: 'The configurator preview is cut off on my small phone.', at: ago(2) },
];
for (const [i, p] of seeded.entries()) {
  await store.createPost({ projectId: 'site', author: `NQ00SEED${i}`, anon: true, status: 'open', ...p });
}

createApp({ store, postsPerIpDay: 20 }).listen(PORT, () => {
  console.log(`Local board on http://localhost:${PORT}, project "site": screenshots off, posts wait for approval`);
  console.log('To be its owner in the browser, run this in the site\'s console and reload:');
  // The proof remembered for the old key goes too, or the board would go on
  // seeing the visitor it was before.
  console.log(
    `  localStorage.setItem('pleasenobugs.guest', ${JSON.stringify(JSON.stringify({ jwk }))}); ` +
      `Object.keys(localStorage).filter((k) => k.startsWith('pleasenobugs.proof.')).forEach((k) => localStorage.removeItem(k))`,
  );
});
