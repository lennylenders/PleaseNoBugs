import type { AppLogin, PostContext, PostKind } from '@pleasenobugs/core';
import { define, TAG, type PleaseNoBugsElement } from './element.js';
import type { Strings } from './i18n.js';
import type { Signer } from './signer.js';

export * from './client.js';
export { PleaseNoBugsElement, readableOn } from './element.js';
export type { Strings, CopyKey } from './i18n.js';

// Importing the package is what makes `<please-no-bugs>` work.
define();

export interface OpenOptions {
  project: string;
  server: string;
  lang?: string;
  theme?: 'auto' | 'light' | 'dark' | 'pleasenobugs' | 'nimiq' | 'shitti';
  accent?: string;
  appName?: string;
  /** A display name to suggest when the user chooses to show theirs. */
  name?: string;
  signer?: Signer;
  /** Your app's own login, reused so nobody signs twice (see `appLogin` on the element). */
  appLogin?: AppLogin | null;
  context?: PostContext;
  noise?: string[];
  strings?: Strings;
  /** Offer only these kinds, of the ones the project takes. */
  kinds?: PostKind[];
  /** `'owners'` keeps screenshots off the board, for your eyes only; `false` leaves the button out. */
  screenshots?: boolean | 'owners';
  /** The board to read and nothing else: no writing or voting, every post anonymous, no screenshots. */
  readonly?: boolean;
  /** `false` leaves out "Show my name", so every post is anonymous. */
  names?: boolean;
}

/**
 * Open the board over the whole screen, from a button of your own.
 * Answers a function that closes it again.
 *
 * @example
 * import { open } from 'pleasenobugs';
 * menuItem.onclick = () => open({ project: 'k7q2m9xw4p', server: 'https://feedback.example.com' });
 */
export function open(options: OpenOptions): () => void {
  const el = document.createElement(TAG) as PleaseNoBugsElement;
  el.setAttribute('mode', 'overlay');
  el.setAttribute('project', options.project);
  el.setAttribute('server', options.server);
  if (options.lang) el.setAttribute('lang', options.lang);
  if (options.theme) el.setAttribute('theme', options.theme);
  if (options.accent) el.setAttribute('accent', options.accent);
  if (options.appName) el.setAttribute('app-name', options.appName);
  if (options.name) el.setAttribute('name', options.name);
  if (options.kinds) el.setAttribute('kinds', options.kinds.join(','));
  if (options.screenshots === false) el.setAttribute('screenshots', 'off');
  if (options.screenshots === 'owners') el.setAttribute('screenshots', 'owners');
  if (options.readonly) el.setAttribute('readonly', '');
  if (options.names === false) el.setAttribute('names', 'off');
  el.signer = options.signer;
  el.appLogin = options.appLogin;
  el.context = options.context;
  el.noise = options.noise;
  el.strings = options.strings;
  const remove = () => el.remove();
  el.addEventListener('pleasenobugs:close', remove, { once: true });
  document.body.append(el);
  return () => el.close();
}
