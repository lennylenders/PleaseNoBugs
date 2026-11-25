import { render } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { POST_KINDS, type AppLogin, type PostContext, type PostKind } from '@pleasenobugs/core';
import { createClient, type Client } from './client.js';
import { translator, type Strings } from './i18n.js';
import type { Signer } from './signer.js';
import { App, type View } from './ui/App.js';
import type { Screenshots } from './ui/Compose.js';
import type { DemoSample } from './demo.js';
import * as Icon from './ui/icons.js';
import css from './styles.css?inline';

export const TAG = 'please-no-bugs';

/**
 * `<please-no-bugs>`: the whole board as one tag.
 *
 * Three ways to show it, picked by the `mode` attribute:
 *
 * - `inline` (default): fills the element. Give it a height, or it grows with
 *   its contents.
 * - `floating`: a small button in the corner that opens the board over the
 *   whole screen. The "paste one line and done" route.
 * - `overlay`: the board over the whole screen, now. What {@link open} uses.
 *
 * Each opens on the tiles that ask what to write, with the board one tap
 * under them; `start="board"` opens on the board instead. Outside Nimiq Pay,
 * somebody not signed in always starts on the board, and the + asks them to
 * sign in before the tiles.
 *
 * Attributes: `project` and `server` (both required, unless `demo`), `mode`,
 * `start` (`tiles` or `board`), `theme` (`nimiq`, the default, or `nimiq-dark`),
 * `lang` (the language of your `strings`, for dates; English by default), `app-name`, `name` (a display name to suggest), `kinds` (which
 * of `bug,idea,review` to offer), `screenshots` (`owners` to keep them off
 * the board, for the app's owners only; `off` to leave them out), `names`
 * (`off` leaves out the name and the "Post anonymously" switch, so every post
 * is anonymous),
 * `readonly` (the board to scroll through and nothing else: see
 * `readonly.ts`), `demo` (sample posts in the page's memory, no server: see
 * `demo.ts`; `demo="owner"` is the owner's side of it) and, with `demo` only, `screen` (`button`, `tiles`, `board`,
 * `write`, `sent` or `updates`: that screen, held, for the website's
 * Make it yours).
 *
 * Properties, for things an attribute cannot carry: `signer`, `appLogin`,
 * `context`, `noise`, `strings` and, with `demo`, `samples`.
 *
 * Events: `pleasenobugs:posted` (`detail: { id, kind }`) and
 * `pleasenobugs:close`.
 *
 * **It renders into a shadow root**, so the host app's CSS cannot reach in and
 * break it and its CSS cannot leak out. Theming goes through the `--pnb-*`
 * custom properties, which do cross that boundary on purpose.
 */
export class PleaseNoBugsElement extends HTMLElement {
  static observedAttributes = [
    'project',
    'server',
    'mode',
    'start',
    'lang',
    'theme',
    'app-name',
    'name',
    'kinds',
    'screenshots',
    'readonly',
    'names',
    'demo',
    'screen',
  ];

  #root: ShadowRoot | null = null;
  #mount: HTMLDivElement | null = null;
  #client: Client | null = null;
  #clientKey = '';
  #signer?: Signer;
  #appLogin?: AppLogin | null;
  #context?: PostContext;
  #noise?: string[];
  #strings?: Strings;
  #warnLater?: ReturnType<typeof setTimeout>;
  #samples?: DemoSample[];
  /** The demo board's code, fetched the first time `demo` is set. */
  #demo?: typeof import('./demo.js');

  /** How to sign outside Nimiq Pay. Inside it the widget signs by itself. */
  get signer() {
    return this.#signer;
  }
  set signer(v: Signer | undefined) {
    this.#signer = v;
    this.#clientKey = '';
    this.#render();
  }

  /**
   * Your app's own wallet login, so nobody signs twice: `{ address, publicKey,
   * signature, message }`. Needs the project to list that message. Set it to
   * null on logout.
   */
  get appLogin() {
    return this.#appLogin;
  }
  set appLogin(v: AppLogin | null | undefined) {
    this.#appLogin = v;
    // A new client, so the board re-reads as whoever is signed in now.
    this.#clientKey = '';
    this.#render();
  }

  /** Sent with every bug report, to owners only: `{ version: '1.4.0' }`. */
  get context() {
    return this.#context;
  }
  set context(v: PostContext | undefined) {
    this.#context = v;
    this.#render();
  }

  /** Words common in your app, so "said already?" ignores them: `['nim', 'wallet']`. */
  get noise() {
    return this.#noise;
  }
  set noise(v: string[] | undefined) {
    this.#noise = v;
    this.#render();
  }

  /** Override any string, or put the whole board in your app's language: `{ 'board.title': 'Ideas box' }`. */
  get strings() {
    return this.#strings;
  }
  set strings(v: Strings | undefined) {
    this.#strings = v;
    this.#render();
  }

  /**
   * With `demo` only: the posts the demo board starts with, instead of its
   * own, and no updates: `[{ kind: 'idea', text: 'Pin my contacts', votes: 12 }]`.
   */
  get samples() {
    return this.#samples;
  }
  set samples(v: DemoSample[] | undefined) {
    this.#samples = v;
    // A fresh board, starting from these.
    this.#clientKey = '';
    this.#render();
  }

  connectedCallback() {
    if (!this.#root) {
      this.#root = this.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = css;
      this.#mount = document.createElement('div');
      this.#mount.style.height = '100%';
      this.#root.append(style, this.#mount);
    }
    this.#render();
  }

  disconnectedCallback() {
    if (this.#mount) render(null, this.#mount);
  }

  attributeChangedCallback(name: string) {
    if (name === 'project' || name === 'server' || name === 'demo' || name === 'readonly') this.#clientKey = '';
    this.#render();
  }

  /** Close an overlay: slide it away, then tell the page. */
  close() {
    this.dispatchEvent(new CustomEvent('pleasenobugs:close', { bubbles: true, composed: true }));
  }

  #render() {
    if (!this.#mount || !this.isConnected) return;
    const lang = this.getAttribute('lang') || 'en';
    if (this.hasAttribute('demo')) {
      // Its own chunk in the module build, so an app that never sets `demo`
      // never downloads the sample posts.
      if (!this.#demo) {
        void import('./demo.js').then((m) => {
          this.#demo = m;
          this.#render();
        });
        return;
      }
      // `demo="owner"`: the same board, seen by the app's owner.
      const owner = this.getAttribute('demo') === 'owner';
      // A `server` on a demo only draws the identicons; the posts stay in the page.
      const identicons = this.getAttribute('server') || undefined;
      const key = `demo|${owner}|${identicons ?? ''}`;
      if (!this.#client || this.#clientKey !== key) {
        this.#client = this.#demo.createDemoClient({ owner, samples: this.#samples, identicons });
        this.#clientKey = key;
      }
      this.#show(this.#client, lang);
      return;
    }
    const project = this.getAttribute('project');
    const server = this.getAttribute('server');
    if (!project || !server) {
      render(null, this.#mount);
      // Said a moment later rather than now: the common pattern is to set the
      // attributes from a script right after the element is parsed, and a
      // warning for a state that lasted one tick is noise in somebody's console.
      clearTimeout(this.#warnLater);
      this.#warnLater = setTimeout(() => {
        if (!this.getAttribute('project') || !this.getAttribute('server')) {
          console.warn('[pleasenobugs] <please-no-bugs> needs both a `project` and a `server` attribute.');
        }
      }, 1000);
      return;
    }
    const readonly = this.hasAttribute('readonly');
    const key = `${server}|${project}|${readonly}`;
    if (!this.#client || this.#clientKey !== key) {
      // Read-only reads as a stranger: no wallet to ask, no app login, and no
      // proof remembered from an earlier visit, so the server never learns who
      // is looking, even inside Nimiq Pay.
      this.#client = readonly
        ? createClient({ server, project, signer: null, appLogin: null, storage: null })
        : createClient({ server, project, signer: this.#signer, appLogin: this.#appLogin });
      this.#clientKey = key;
    }
    this.#show(this.#client, lang);
  }

  #show(client: Client, lang: string) {
    if (!this.#mount) return;
    const mode = this.getAttribute('mode') ?? 'inline';
    const app = {
      client,
      t: translator(this.#strings),
      locale: lang,
      appName: this.getAttribute('app-name') ?? undefined,
      suggestName: this.getAttribute('name') ?? undefined,
      context: this.#context,
      noise: this.#noise,
      kinds: readKinds(this.getAttribute('kinds')),
      screenshots: readScreenshots(this.getAttribute('screenshots')),
      readonly: this.hasAttribute('readonly'),
      names: this.getAttribute('names') !== 'off',
      onPosted: (p: { id: string; kind: PostKind }) =>
        this.dispatchEvent(new CustomEvent('pleasenobugs:posted', { detail: p, bubbles: true, composed: true })),
    };

    // Never outside the demo: a real board always opens as it should. Nor on
    // a read-only one, which has no screen but the board.
    const screen =
      this.hasAttribute('demo') && !app.readonly ? readScreen(this.getAttribute('screen')) : undefined;
    const held = screen === 'button' ? undefined : screen;
    // The tiles first, whichever way it is shown: somebody who opens a
    // feedback feature mostly came to say something. The board is one tap on.
    const start = this.getAttribute('start') === 'board' ? 'board' : 'choose';

    if (mode === 'floating') {
      render(<Floating app={app} label={app.t('board.open')} screen={screen} start={start} />, this.#mount);
    } else if (mode === 'overlay') {
      render(<Overlay app={app} start={start} screen={held} onGone={() => this.close()} />, this.#mount);
    } else {
      render(<App {...app} start={start} screen={held} />, this.#mount);
    }
  }
}

type AppBase = Omit<Parameters<typeof App>[0], 'onClose' | 'screen'>;

/** What the `screen` attribute says: the round button, or a screen of the board. */
type Screen = 'button' | View;

/**
 * The `screen` attribute in the board's own words, or undefined for none.
 *
 * @example
 * readScreen('write')   // → 'compose'
 * readScreen('nope')    // → undefined
 */
export function readScreen(v: string | null): Screen | undefined {
  const views: Record<string, Screen> = {
    button: 'button',
    tiles: 'choose',
    board: 'board',
    write: 'compose',
    sent: 'sent',
    updates: 'updates',
  };
  return v ? views[v.trim().toLowerCase()] : undefined;
}

/**
 * The board over the page, which slides away before it says it is gone.
 *
 * **On a phone it is the whole screen**; anything smaller is a board you have
 * to aim at. **On a wider screen it is a panel in the bottom-right corner**,
 * where the button was, over a dimmed page: the app stays in view, and a click
 * beside the panel or Escape closes it. Which of the two is decided by the
 * stylesheet alone (`.overlay` at 640px), so a window dragged narrower changes
 * over without a re-render.
 */
function Overlay({
  app,
  onGone,
  start,
  screen,
  button,
  grow,
}: {
  app: AppBase;
  onGone: () => void;
  start?: 'board' | 'choose';
  screen?: View;
  /** The round button it belongs to: it shrinks back into that one on close. */
  button?: () => HTMLElement | null;
  /** Opened by a tap on that button: it grows out of it. */
  grow?: boolean;
}) {
  const [leaving, setLeaving] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const leave = () => {
    if (leaving) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return onGone();
    setLeaving(true);
    const from = button?.();
    if (from && panel.current) morph(panel.current, from, 'close').then(onGone);
  };

  useLayoutEffect(() => {
    const from = button?.();
    if (grow && from && panel.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      void morph(panel.current, from, 'open');
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // A sheet inside closes first, on its own Escape.
      if (e.key === 'Escape' && !panel.current?.querySelector('.scrim')) leave();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <div class={`backdrop${leaving ? ' backdrop--leaving' : ''}`} onClick={leave} />
      <div
        ref={panel}
        class={`overlay${button ? ' overlay--morph' : ''}${leaving ? ' overlay--leaving' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={app.t('board.title')}
        onAnimationEnd={(e) => {
          if (leaving && e.target === e.currentTarget) onGone();
        }}
      >
        <App {...app} onClose={leave} start={start} screen={screen} />
      </div>
    </>
  );
}

/**
 * A round button in the corner, and the panel it opens on the tiles.
 *
 * **The button becomes the panel**: a tap grows it out of its corner into
 * the panel, and closing shrinks the panel back into it (see {@link morph}).
 * So the button stays in the page while the panel is open, out of sight, to
 * measure where to grow from and shrink to.
 */
function Floating({
  app,
  label,
  screen,
  start,
}: {
  app: AppBase;
  label: string;
  screen?: Screen;
  start: 'board' | 'choose';
}) {
  const [open, setOpen] = useState(!!screen && screen !== 'button');
  // Only a tap grows it; a screen the demo holds open is simply there.
  const [grow, setGrow] = useState(false);
  const fab = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (screen) setOpen(screen !== 'button');
  }, [screen]);
  return (
    <>
      <button
        ref={fab}
        type="button"
        class={`fab${open ? ' fab--away' : ''}`}
        aria-label={label}
        title={label}
        aria-hidden={open}
        tabIndex={open ? -1 : 0}
        onClick={() => {
          setGrow(true);
          setOpen(true);
        }}
      >
        <Icon.Feedback />
      </button>
      {open && (
        <Overlay
          app={app}
          start={start}
          screen={screen === 'button' ? undefined : screen}
          button={() => fab.current}
          grow={grow}
          onGone={() => {
            setOpen(false);
            setGrow(false);
          }}
        />
      )}
    </>
  );
}

/** How long the button takes to become the panel, and the panel the button. */
const MORPH_OPEN_MS = 340;
const MORPH_CLOSE_MS = 260;
/** How long the button takes to come back once the panel is a disc again. */
const FAB_BACK_MS = 160;

/**
 * Grow the panel out of the round button, or shrink it back in.
 *
 * The panel is cut to the button's disc and the cut opens to the whole
 * panel (`clip-path`), so what grows is the panel itself, in its own
 * background: the button is gone the moment it is tapped, never stretched.
 * What is in the panel fades in as it opens, scaled up a little from the
 * button's corner. Closing runs it backwards, quicker, and the button comes
 * back only once the panel is a disc where it was. Resolves once it is
 * done; the closing state is held until then, so nothing flashes before the
 * panel is taken away.
 *
 * Opacity, scale and the cut only, no blur: those a browser can draw every
 * frame, so it stays smooth on a phone too.
 *
 * With the Web Animations API rather than CSS, because where the button is,
 * relative to the panel, is only known once both are on the screen.
 */
function morph(panel: HTMLElement, button: HTMLElement, way: 'open' | 'close'): Promise<void> {
  if (typeof panel.animate !== 'function') return Promise.resolve();
  const box = panel.getBoundingClientRect();
  const fab = button.getBoundingClientRect();
  const round = fab.width / 2;
  const small = `inset(${fab.top - box.top}px ${box.right - fab.right}px ${box.bottom - fab.bottom}px ${fab.left - box.left}px round ${round}px)`;
  const big = `inset(0px 0px 0px 0px round ${getComputedStyle(panel).borderTopLeftRadius})`;
  const open = way === 'open';
  const timing: KeyframeAnimationOptions = {
    duration: open ? MORPH_OPEN_MS : MORPH_CLOSE_MS,
    easing: open ? 'cubic-bezier(0.3, 0.9, 0.3, 1)' : 'cubic-bezier(0.5, 0, 0.75, 0)',
    fill: open ? 'none' : 'forwards',
  };

  const content = panel.firstElementChild as HTMLElement | null;
  if (content) content.style.transformOrigin = `${fab.left + round - box.left}px ${fab.top + round - box.top}px`;

  const cut = open ? [{ clipPath: small }, { clipPath: big }] : [{ clipPath: big }, { clipPath: small }];
  const runs = [panel.animate(cut, timing)];
  if (content) {
    runs.push(
      content.animate(
        open
          ? [
              { opacity: 0, transform: 'scale(0.96)', offset: 0 },
              { opacity: 0, transform: 'scale(0.96)', offset: 0.15 },
              { opacity: 1, transform: 'scale(1)', offset: 0.8 },
              { opacity: 1, transform: 'scale(1)', offset: 1 },
            ]
          : [
              { opacity: 1, transform: 'scale(1)', offset: 0 },
              { opacity: 0, transform: 'scale(0.96)', offset: 0.55 },
              { opacity: 0, transform: 'scale(0.96)', offset: 1 },
            ],
        { ...timing, easing: open ? 'ease-out' : 'ease-in' },
      ),
    );
  }
  return Promise.all(runs.map((r) => r.finished))
    .catch(() => undefined)
    .then(() => {
      if (open) {
        if (content) content.style.transformOrigin = '';
        return;
      }
      // The button back where the disc ends, before the panel goes: no
      // frame without either.
      button.classList.remove('fab--away');
      panel.style.visibility = 'hidden';
      if (typeof button.animate === 'function') {
        button.animate([{ opacity: 0, transform: 'scale(0.8)' }, { opacity: 1, transform: 'scale(1)' }], {
          duration: FAB_BACK_MS,
          easing: 'ease-out',
        });
      }
    });
}

/**
 * Who sees screenshots, from the attribute: on the board when it is absent,
 * empty or `board`. Anything else unknown, a typo of `owners` say, keeps them
 * for the owners: a mistake here should fail private.
 */
function readScreenshots(v: string | null): Screenshots {
  if (v === null || v === '' || v === 'board') return 'board';
  return v === 'off' ? 'off' : 'owners';
}

/**
 * The `kinds` attribute as a list, or undefined for "all the project takes".
 * Unknown words are dropped rather than refused: a typo should cost a tile,
 * not the whole board.
 *
 * @example
 * readKinds('bug, review')   // → ['bug', 'review']
 */
export function readKinds(v: string | null): PostKind[] | undefined {
  if (v === null || !v.trim()) return undefined;
  return v
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is PostKind => (POST_KINDS as readonly string[]).includes(s));
}

/** Register the element once, however many times the script is loaded. */
export function define() {
  if (typeof customElements !== 'undefined' && !customElements.get(TAG)) {
    customElements.define(TAG, PleaseNoBugsElement);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'please-no-bugs': PleaseNoBugsElement;
  }
}
