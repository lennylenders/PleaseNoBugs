/**
 * What the widget needs from a wallet: sign one message, and say which address
 * signed it.
 *
 * That is the whole of the interface, on purpose. Inside Nimiq Pay the widget
 * fills it by itself ({@link nimiqPaySigner}). Anywhere else the app hands one
 * in, because the app already has its own wallet integration and the widget
 * shipping a second one (the Hub, its popups, its redirects) would be bigger
 * and worse at it.
 *
 * The signature must be the Keyguard's: Ed25519 over
 * `SHA256("\x16Nimiq Signed Message:\n" + length + message)`. Nimiq Pay's
 * `sign()` and the Hub's `signMessage()` both produce exactly that.
 *
 * @example
 * // A browser app using the Nimiq Hub:
 * import HubApi from '@nimiq/hub-api';
 * const hub = new HubApi('https://hub.nimiq.com');
 * const signer: Signer = async (message) => {
 *   const r = await hub.signMessage({ appName: 'My app', message });
 *   return { address: r.signer, publicKey: toHex(r.signerPublicKey), signature: toHex(r.signature) };
 * };
 */
export type Signer = (message: string) => Promise<SignedMessage>;

export interface SignedMessage {
  /** The address that signed, in any spelling. */
  address: string;
  /** Hex. */
  publicKey: string;
  /** Hex. */
  signature: string;
}

/**
 * Why signing did not happen. `declined` is the user saying no, which is an
 * answer and not a failure: the widget says nothing about it.
 */
export class SignerError extends Error {
  constructor(
    public readonly reason: 'no_wallet' | 'no_account' | 'declined',
    message?: string,
  ) {
    super(message ?? reason);
    this.name = 'SignerError';
  }
}

/** The bits of Nimiq Pay's injected provider this file touches. */
interface NimiqProvider {
  listAccounts(): Promise<string[] | { error: { message: string } }>;
  sign(message: string): Promise<{ publicKey: string; signature: string } | { error: { message: string } }>;
}

declare global {
  interface Window {
    nimiq?: NimiqProvider;
    nimiqPay?: { language?: string };
  }
}

/** How long to wait for Nimiq Pay to inject its provider. It is normally there
 *  before the page's first script; this covers the times it is a tick late. */
const WAIT_MS = 2_000;

/**
 * Whether the page is running inside Nimiq Pay, right now. Synchronous, so it
 * can decide what to draw; {@link nimiqPaySigner} waits a little longer.
 */
export function insideNimiqPay(): boolean {
  return typeof window !== 'undefined' && !!window.nimiq;
}

function provider(timeout: number): Promise<NimiqProvider> {
  if (window.nimiq) return Promise.resolve(window.nimiq);
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = setInterval(() => {
      if (window.nimiq) {
        clearInterval(tick);
        resolve(window.nimiq);
      } else if (Date.now() - started > timeout) {
        clearInterval(tick);
        reject(new SignerError('no_wallet', 'Not running inside Nimiq Pay'));
      }
    }, 50);
  });
}

/**
 * Signs with the wallet Nimiq Pay is logged in with.
 *
 * Two calls because the provider splits them: `listAccounts()` says which
 * address, `sign()` proves it. The address is sent as the wallet said it rather
 * than derived from the public key, which would mean shipping Nimiq's WASM to a
 * phone to do one hash; the server derives it anyway and refuses a mismatch.
 */
export function nimiqPaySigner(timeout: number = WAIT_MS): Signer {
  return async (message) => {
    const nimiq = await provider(timeout);
    const accounts = await nimiq.listAccounts();
    if (!Array.isArray(accounts) || !accounts.length) throw new SignerError('no_account');
    const signed = await nimiq.sign(message);
    if (!signed || !('signature' in signed)) {
      throw new SignerError('declined', signed && 'error' in signed ? signed.error.message : undefined);
    }
    return { address: accounts[0], publicKey: signed.publicKey, signature: signed.signature };
  };
}
