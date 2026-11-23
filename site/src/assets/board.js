/**
 * Who signs on the home page's board.
 *
 * - **Inside Nimiq Pay**, the wallet, as in any app: nothing to do here.
 * - **Everywhere else**, the Nimiq Hub: the visitor signs in with their own
 *   Nimiq wallet in the Hub's window, or makes one there for free. Reading
 *   needs nothing; posting and voting need a wallet, so every voice on this
 *   board is a wallet, once.
 * - **On this machine with a test key** (`site/dev/testkey.js`, printed by
 *   `board.mjs`), that key, so the site can be tried without a real wallet.
 *
 * The Hub's script loads from jsDelivr, pinned, and only once somebody
 * touches the board: a visitor who only reads the page never fetches it. It
 * has to be there by the time "Sign in" is tapped, because the Hub opens a
 * window, and a browser only lets a page do that straight after a tap.
 *
 * The board itself is real: posts go to PleaseNoBugs' own server, show at
 * once, with the author's identicon and name unless they post anonymously,
 * and carry no screenshots, which the server refuses on that board whatever
 * is sent.
 */

/** Pinned, so a new Hub release never changes the site unasked. */
const HUB = 'https://cdn.jsdelivr.net/npm/@nimiq/hub-api@1.15.0/dist/standalone/HubApi.standalone.es.js';

const boards = [...document.querySelectorAll('please-no-bugs[project]:not([readonly])')];
if (boards.length) {
  forgetGuest(boards);
  await customElements.whenDefined('please-no-bugs');
  const { insideNimiqPay } = window.PleaseNoBugs;
  if (!insideNimiqPay()) {
    const signer = (await testKey()) ?? hubSigner(boards);
    for (const b of boards) b.signer = signer;
  }
}

/** The Hub, asked to sign with the wallet the visitor picks. */
function hubSigner(boards) {
  let hub = null;
  const load = () =>
    (hub ??= import(HUB).then(({ default: HubApi }) => new HubApi('https://hub.nimiq.com')).catch((e) => {
      hub = null;
      throw e;
    }));
  // Loaded on the first touch of the board, ahead of the tap that signs.
  for (const b of boards) b.addEventListener('pointerdown', () => void load().catch(() => {}), { once: true });
  const hex = (bytes) => Array.from(bytes, (x) => x.toString(16).padStart(2, '0')).join('');
  return async (message) => {
    const api = await load();
    const r = await api.signMessage({ appName: 'PleaseNoBugs', message });
    return { address: r.signer, publicKey: hex(r.signerPublicKey), signature: hex(r.signature) };
  };
}

/** The local test key, when there is one and this is the local site. */
async function testKey() {
  if (location.hostname !== 'localhost') return null;
  try {
    const { hasTestKey, testKeySigner } = await import('../dev/testkey.js');
    return hasTestKey() ? testKeySigner() : null;
  } catch {
    return null;
  }
}

/**
 * Until 2026-11, this site gave every visitor a key of its own instead of a
 * wallet. That key, and the proof it signed (which the widget would go on
 * using for weeks), are dropped, so a visitor from then signs in with a
 * wallet like everybody else.
 */
function forgetGuest(boards) {
  try {
    if (localStorage.getItem('pleasenobugs.guest') === null) return;
    localStorage.removeItem('pleasenobugs.guest');
    for (const b of boards) localStorage.removeItem(`pleasenobugs.proof.${b.getAttribute('project')}.${location.origin}`);
  } catch {
    // Nothing remembered where storage is off.
  }
}
