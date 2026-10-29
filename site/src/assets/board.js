/**
 * Who signs on the home page's board.
 *
 * - **Inside Nimiq Pay**, the wallet, as in any app: nothing to do here.
 * - **With `#owner` in the address**, the Nimiq Hub, so the owner can sign in
 *   with their real wallet from a computer and approve or answer posts. The
 *   Hub's script is fetched only then, so a visitor's page never loads it.
 * - **Everybody else**, a guest key this browser makes for itself
 *   (`guest.js`), so a visitor can post and vote with no wallet at all.
 *
 * The board itself is real: posts go to PleaseNoBugs' own server and show
 * once the owner approved them (`rules.approve` on that project). No names
 * (`names="off"`) and no screenshots, which the server refuses on that board
 * whatever is sent.
 */
import { guestSigner } from './guest.js';

/** Pinned, so a new Hub release never changes the site unasked. */
const HUB = 'https://cdn.jsdelivr.net/npm/@nimiq/hub-api@1.15.0/dist/standalone/HubApi.standalone.es.js';

/** What the board says about who you are, true for a guest key instead of a wallet. */
const GUEST = {
  'board.anonNote':
    'Nobody sees who wrote it: this board shows no names. Your browser keeps a key of its own, which counts your votes and your posts per day. No account, no email.',
  'board.needWallet': 'This browser cannot sign here. Try a recent Chrome, Safari or Firefox, or open it in Nimiq Pay.',
  'board.signIn': 'Show what is left of my day',
};

const boards = [...document.querySelectorAll('please-no-bugs[project]:not([readonly])')];
if (boards.length) {
  await customElements.whenDefined('please-no-bugs');
  const { insideNimiqPay } = window.PleaseNoBugs;
  if (location.hash === '#owner') {
    forget(boards);
    const signer = await hubSigner();
    for (const b of boards) b.signer = signer;
  } else if (!insideNimiqPay()) {
    const signer = guestSigner();
    for (const b of boards) {
      b.signer = signer;
      b.strings = GUEST;
    }
  }
}

/** The Hub, asked to sign with the wallet the owner picks. */
async function hubSigner() {
  const { default: HubApi } = await import(HUB);
  const hub = new HubApi('https://hub.nimiq.com');
  const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return async (message) => {
    const r = await hub.signMessage({ appName: 'PleaseNoBugs', message });
    return { address: r.signer, publicKey: hex(r.signerPublicKey), signature: hex(r.signature) };
  };
}

/** Drop a proof this browser remembers, so the owner signs in fresh rather than as the guest it was. */
function forget(boards) {
  for (const b of boards) {
    try {
      localStorage.removeItem(`pleasenobugs.proof.${b.getAttribute('project')}.${location.origin}`);
    } catch {
      // Nothing remembered where storage is off.
    }
  }
}
