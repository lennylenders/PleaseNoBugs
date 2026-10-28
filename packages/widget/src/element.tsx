import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { POST_KINDS, type AppLogin, type PostContext, type PostKind } from '@pleasenobugs/core';
import { createClient, type Client } from './client.js';
import { pickLang, translator, type Strings } from './i18n.js';
import type { Signer } from './signer.js';
import { App } from './ui/App.js';
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
 * Attributes: `project` and `server` (both required), `mode`, `lang`,
 * `theme` (`auto` | `light` | `dark` | `vivid` | `shitti`), `accent` (a
 * colour), `app-name`, `name` (a display name to suggest), `kinds` (which of
 * `bug,idea,review` to offer) and `screenshots` (`off` to leave them out).
 *
 * Properties, for things an attribute cannot carry: `signer`, `appLogin`,
 * `context`, `noise`, `strings`.
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
    'lang',
    'theme',
    'accent',
    'app-name',
    'name',
    'kinds',
    'screenshots',
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

  /** Override any string, or supply a language: `{ 'board.title': 'Ideas box' }`. */
  get strings() {
    return this.#strings;
  }
  set strings(v: Strings | undefined) {
    this.#strings = v;
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
    if (name === 'project' || name === 'server') this.#clientKey = '';
    if (name === 'accent') this.#paintAccent();
    this.#render();
  }

  /** Close an overlay: slide it away, then tell the page. */
  close() {
    this.dispatchEvent(new CustomEvent('pleasenobugs:close', { bubbles: true, composed: true }));
  }

  #paintAccent() {
    const accent = this.getAttribute('accent');
    // The fill too, so one colour beats a theme's gradient on the buttons.
    if (accent) {
      this.style.setProperty('--pnb-accent', accent);
      this.style.setProperty('--pnb-accent-fill', accent);
      this.style.setProperty('--pnb-on-accent', readableOn(accent));
    } else {
      this.style.removeProperty('--pnb-accent');
      this.style.removeProperty('--pnb-accent-fill');
      this.style.removeProperty('--pnb-on-accent');
    }
  }

  #render() {
    if (!this.#mount || !this.isConnected) return;
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
    const key = `${server}|${project}`;
    if (!this.#client || this.#clientKey !== key) {
      this.#client = createClient({ server, project, signer: this.#signer, appLogin: this.#appLogin });
      this.#clientKey = key;
    }

    const lang = pickLang(this.getAttribute('lang'));
    const mode = this.getAttribute('mode') ?? 'inline';
    const app = {
      client: this.#client,
      t: translator(lang, this.#strings),
      locale: lang,
      appName: this.getAttribute('app-name') ?? undefined,
      suggestName: this.getAttribute('name') ?? undefined,
      context: this.#context,
      noise: this.#noise,
      kinds: readKinds(this.getAttribute('kinds')),
      screenshots: this.getAttribute('screenshots') !== 'off',
      onPosted: (p: { id: string; kind: PostKind }) =>
        this.dispatchEvent(new CustomEvent('pleasenobugs:posted', { detail: p, bubbles: true, composed: true })),
    };

    if (mode === 'floating') {
      render(<Floating app={app} label={app.t('board.open')} />, this.#mount);
    } else if (mode === 'overlay') {
      render(<Overlay app={app} onGone={() => this.close()} />, this.#mount);
    } else {
      render(<App {...app} />, this.#mount);
    }
  }
}

type AppBase = Omit<Parameters<typeof App>[0], 'onClose'>;

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
function Overlay({ app, onGone, start }: { app: AppBase; onGone: () => void; start?: 'board' | 'choose' }) {
  const [leaving, setLeaving] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const leave = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return onGone();
    setLeaving(true);
  };

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
        class={`overlay${leaving ? ' overlay--leaving' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={app.t('board.title')}
        onAnimationEnd={(e) => {
          if (leaving && e.target === e.currentTarget) onGone();
        }}
      >
        <App {...app} onClose={leave} start={start} />
      </div>
    </>
  );
}

/** A round button in the corner, and the panel it opens on the tiles. */
function Floating({ app, label }: { app: AppBase; label: string }) {
  const [open, setOpen] = useState(false);
  return open ? (
    <Overlay app={app} start="choose" onGone={() => setOpen(false)} />
  ) : (
    <button type="button" class="fab" aria-label={label} title={label} onClick={() => setOpen(true)}>
      <Icon.Feedback />
    </button>
  );
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

/**
 * Black or white, whichever reads better on `color`. So `accent="#ffd400"`
 * gets dark text and `accent="#1f2348"` gets white, without the developer
 * having to know there was a question.
 */
export function readableOn(color: string): string {
  const hex = color.trim().replace('#', '');
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(full)) return '#ffffff';
  const channel = (i: number) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  // White wins when it out-contrasts black: (1.05) / (L + 0.05) vs (L + 0.05) / 0.05.
  return 1.05 / (lum + 0.05) >= (lum + 0.05) / 0.05 ? '#ffffff' : '#111118';
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
