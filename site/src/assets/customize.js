/**
 * Get your widget: one clean column. The widget style (PleaseNoBugs, the one
 * there is, with more to come), a phone with an app on it where the real
 * widget plays somebody sending a bug, a switch between
 * Light and Dark, and the prompt for the developer's AI agent, with the code
 * for who prefers to add it by hand.
 *
 * How it opens and where the app runs are no longer asked here: the prompt
 * asks the developer through their agent, and the code starts as a round
 * button with the signer for outside Nimiq Pay, which is right everywhere.
 *
 * **Everything lives in this page's memory.** Nothing is saved, not even in
 * `localStorage`: the copied code is the only place a choice ends up.
 */

/** The npm version the copied code loads, filled in from the widget's
 *  package.json by `site/files.mjs`. Pinned, so a later release never changes
 *  somebody's app without them choosing to. */
const VERSION = '%VERSION%';

const REPO = 'https://github.com/lennylenders/PleaseNoBugs';

const state = {
  /** How the copied code opens the widget; the prompt asks about it first. */
  mode: 'floating',
  /** `dark` rather than `light`. */
  dark: false,
};

const theme = () => (state.dark ? 'dark' : 'light');

// ---- The demo on the phone: somebody sends a bug ---------------------------

/**
 * A phone with an app on it and the real widget in it, in `demo` mode, and
 * one story played over and over: tap the round button, pick Bug, describe
 * it, add a name, send it, and there it is on the board; then the same user,
 * Mila, writes a review with four stars, and it joins the board too. A ring shows each
 * tap and a line under the phone says the step. The taps are the widget's
 * own buttons, clicked from here, so what plays is what the widget really
 * does; its posts live in this page's memory only, and each round starts
 * with a fresh widget.
 *
 * **Light or dark changes the look while it plays**: only the widget's
 * \`theme\` (and the app around it) change, the story goes on where it is.
 *
 * Its time stands still while the phone is out of view or the tab is
 * hidden. With reduced motion it shows the board, open, and nothing moves.
 */
const phone = document.getElementById('phone');
const said = document.getElementById('phone-said');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

const BUG = 'The save button does nothing on my phone';
const WHO = 'Mila';
const REVIEW = 'Quick and easy to use. A dark mode would make it perfect.';
/** One other bug on the board, somebody else's, so the new one has company. */
const SAMPLES = [{ kind: 'bug', text: 'The send button does nothing after I switch accounts', votes: 4, ago: 20 * 3_600_000, who: 'Sam' }];

/**
 * The widget measures the window to pick a sheet (a phone) or a corner panel
 * (wider); here it is always on a phone, so the phone's look is put in from
 * this page, as on the home page's demo. And no "Said already, maybe?" while
 * the bug is typed: in a demo it is one thing too many.
 */
const PHONE_CSS = `
  .overlay, .overlay--leaving { inset: calc(var(--pnb-sheet-top) + 8px) 0 0 0 !important; width: auto !important;
    max-height: none !important; border-radius: var(--pnb-radius-sheet) var(--pnb-radius-sheet) 0 0 !important; }
  .overlay .app { height: 100% !important; max-height: none !important; }
  .backdrop { display: block !important; }
  .grip { display: block !important; }
  .fab { right: 16px !important; bottom: 16px !important; }
  .alike { display: none !important; }`;

let widget = null;

/** A fresh widget on the phone, in the look picked. */
function mount() {
  widget?.remove();
  widget = document.createElement('please-no-bugs');
  for (const [k, v] of Object.entries({ demo: '', mode: 'floating', screenshots: 'off', server: '%BOARD_SERVER%', theme: theme() })) widget.setAttribute(k, v);
  widget.samples = SAMPLES;
  widget.inert = true;
  phone.append(widget);
  const style = document.createElement('style');
  style.textContent = PHONE_CSS;
  // The shadow root is there once the element is upgraded.
  customElements.whenDefined('please-no-bugs').then(() => widget.shadowRoot?.append(style));
  return widget;
}

/** The look on the widget and the app around it, whatever the story is doing. */
function paintWidget() {
  widget?.setAttribute('theme', theme());
  phone.classList.toggle('phone--dark', state.dark);
}

// Time that only runs while the phone can be seen; a newer round stops an older one.
const STOP = Symbol('stop');
let round = 0;
let seen = true;
new IntersectionObserver(([e]) => (seen = e.isIntersecting)).observe(phone);
async function sleep(ms, mine) {
  let left = ms;
  while (left > 0) {
    await new Promise((r) => setTimeout(r, 50));
    if (mine !== round) throw STOP;
    if (seen && !document.hidden) left -= 50;
  }
}

/** What the widget shows, by a selector or a function over its shadow root, once it is there. */
async function find(sel, mine, tries = 60) {
  for (let i = 0; i < tries; i++) {
    const root = widget?.shadowRoot;
    const hit = root && (typeof sel === 'function' ? sel(root) : root.querySelector(sel));
    if (hit) return hit;
    await sleep(80, mine);
  }
  throw new Error(`Get your widget demo: no ${sel}`);
}

/** A ring over \`target\`, then the tap itself. */
async function tap(target, mine) {
  const b = phone.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const ring = document.createElement('span');
  ring.className = 'tour-tap';
  ring.style.left = `${t.left + t.width / 2 - b.left}px`;
  ring.style.top = `${t.top + t.height / 2 - b.top}px`;
  phone.append(ring);
  requestAnimationFrame(() => ring.classList.add('tour-tap--on'));
  setTimeout(() => ring.remove(), 600);
  await sleep(220, mine);
  target.click();
}

/** Typed into a field of the widget's a letter at a time, as the widget hears it. */
async function type(field, text, mine) {
  for (let i = 1; i <= text.length; i++) {
    field.value = text.slice(0, i);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(45 + Math.random() * 35, mine);
  }
}

const step = (words) => (said.textContent = words);

async function story(mine) {
  for (;;) {
    mount();
    step('');
    await sleep(900, mine);
    step('Your user taps the button');
    await sleep(900, mine);
    await tap(await find('.fab', mine), mine);
    await sleep(1100, mine);

    step('Picks Bug');
    await sleep(900, mine);
    await tap(await find('.tile--bug', mine), mine);
    await sleep(700, mine);

    step('Describes it');
    await type(await find('textarea.field', mine), BUG, mine);
    await sleep(500, mine);
    await type(await find('.name-field input', mine), WHO, mine);
    await sleep(700, mine);

    step('Sends it');
    await tap(await find('.send .btn:not([disabled])', mine), mine);
    await find('.sent', mine);

    // The widget goes on to the board by itself after "Feedback sent!", as in an app.
    await find((root) => !root.querySelector('.sent') && [...root.querySelectorAll('.card__text')].find((t) => t.textContent.startsWith(BUG)), mine, 150);
    step('On the board, for everyone');
    await sleep(3200, mine);

    // Then a review, from the board's own +.
    step('Mila adds a review');
    await sleep(700, mine);
    await tap(await find('.bar [aria-label="Write feedback"]', mine), mine);
    await sleep(900, mine);
    await tap(await find('.tile--review', mine), mine);
    await sleep(700, mine);

    step('Four stars');
    await tap(await find((root) => root.querySelectorAll('.rate__star')[3], mine), mine);
    await sleep(700, mine);

    step('Says why');
    await type(await find('textarea.field', mine), REVIEW, mine);
    await sleep(400, mine);
    // Her name is remembered from the bug; typed again only if it is not.
    const name = widget.shadowRoot.querySelector('.name-field input');
    if (name && !name.value) await type(name, WHO, mine);
    await sleep(600, mine);

    step('Sends it');
    await tap(await find('.send .btn:not([disabled])', mine), mine);
    await find('.sent', mine);
    await find((root) => !root.querySelector('.sent') && [...root.querySelectorAll('.card__text')].find((t) => t.textContent.startsWith(REVIEW)), mine, 150);
    step('Her review is on the board too');
    await sleep(3600, mine);
  }
}

function play() {
  const mine = ++round;
  if (reduce.matches) {
    mount().setAttribute('screen', 'board');
    step('');
    return;
  }
  story(mine).catch((e) => {
    if (e !== STOP) console.warn(e);
  });
}
reduce.addEventListener('change', play);

// ---- Light or dark ---------------------------------------------------------

const switcher = document.getElementById('theme-switch');
switcher.addEventListener('click', (e) => {
  const b = e.target.closest('[data-theme]');
  if (!b) return;
  state.dark = b.dataset.theme === 'dark';
  for (const x of switcher.querySelectorAll('[data-theme]')) x.setAttribute('aria-checked', String(x === b));
  paintWidget();
  writeCode();
});

// ---- The code ------------------------------------------------------------

const attr = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function html() {
  const attrs = [['project', 'YOUR_PROJECT_ID'], ['server', 'https://YOUR_SERVER'], state.mode !== 'inline' && ['mode', state.mode], ['theme', theme()]].filter(Boolean);
  return [
    `<script src="https://unpkg.com/pleasenobugs@${VERSION}"></script>`,
    `<please-no-bugs`,
    ...attrs.map(([k, v]) => `  ${k}="${attr(v)}"`),
    `></please-no-bugs>`,
  ].join('\n');
}

/** The one rule an inline widget needs; nothing otherwise. */
const css = () => (state.mode === 'inline' ? 'please-no-bugs {\n  height: 600px; /* inline: give it a height, or it grows with its posts */\n}' : '');

/**
 * A little colour in the code blocks. One pass over the plain code, each
 * piece escaped on its own, so the colouring can never colour itself.
 */
function highlight(code) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const span = (cls, s) => `<span class="${cls}">${esc(s)}</span>`;
  const re = /(\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*")|(<\/?[a-z-]+|>)|(\s)([a-z-]+)(?==)/g;
  let out = '';
  let last = 0;
  for (const m of code.matchAll(re)) {
    out += esc(code.slice(last, m.index));
    if (m[1]) out += span('c', m[1]);
    else if (m[2]) out += span('s', m[2]);
    else if (m[3]) out += span('t', m[3]);
    else out += m[4] + span('a', m[5]);
    last = m.index + m[0].length;
  }
  return out + esc(code.slice(last));
}

/** The Nimiq Hub, pinned, as the site's own board uses it (assets/board.js). */
const HUB = 'https://cdn.jsdelivr.net/npm/@nimiq/hub-api@1.15.0/dist/standalone/HubApi.standalone.es.js';

/** The signer's body: outside Nimiq Pay, the Nimiq Hub signs with the user's own wallet. */
const SIGNER = [
  "  const hub = new HubApi('https://hub.nimiq.com');",
  "  const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');",
  "  document.querySelector('please-no-bugs').signer = async (message) => {",
  "    const r = await hub.signMessage({ appName: 'Your app', message }); // your app's name, shown in the wallet",
  '    return { address: r.signer, publicKey: hex(r.signerPublicKey), signature: hex(r.signature) };',
  '  };',
];
/** The code carries the signer always: inside Nimiq Pay it is skipped, so it is right wherever the app runs. */
const browser = () => true;

/** The signer for an app with a bundler, for the steps and the prompt. */
function npmSignerOnly() {
  return [
    "import { insideNimiqPay } from 'pleasenobugs';",
    "import HubApi from '@nimiq/hub-api';",
    '',
    '// Once the element is in the page. Outside Nimiq Pay,',
    '// users sign with their Nimiq wallet through the Nimiq Hub.',
    'if (!insideNimiqPay()) {',
    ...SIGNER,
    '}',
  ].join('\n');
}

/** Pasted as HTML: the script, the tag, its CSS if any, and in a browser the signer. */
function htmlRoute() {
  const style = css() ? `\n<style>\n${css()}\n</style>` : '';
  const signer = browser()
    ? [
        '',
        '<!-- Outside Nimiq Pay, users sign with their Nimiq wallet through the Nimiq Hub. -->',
        '<script type="module">',
        `  import HubApi from '${HUB}';`,
        '  if (!PleaseNoBugs.insideNimiqPay()) {',
        ...SIGNER.map((l) => `  ${l}`),
        '  }',
        '</script>',
      ].join('\n')
    : '';
  return `${html()}${style}${signer}\n`;
}

/** With npm: what to install, what to import once, the tag, and in a browser the signer. */
function npmSteps() {
  const tag = html().split('\n').slice(1).join('\n');
  const style = css() ? `\n\n/* In the app's global stylesheet: */\n${css()}` : '';
  if (!browser()) {
    return `npm install pleasenobugs@${VERSION}\n\n// Once, at startup:\nimport 'pleasenobugs';\n\n<!-- Where the board goes: -->\n${tag}${style}\n`;
  }
  const [imports, signer] = npmSignerOnly().split('\n\n');
  return `npm install pleasenobugs@${VERSION} @nimiq/hub-api\n\n// Once, at startup:\n${imports}\n\n<!-- Where the board goes: -->\n${tag}\n\n${signer}${style}\n`;
}

// ---- The prompt ----------------------------------------------------------

/** Where the element goes, per way of showing it. */
const PLACE = {
  floating: 'It draws a round button in the bottom-right corner by itself. Put the element once, near the root, so it is on every screen.',
  inline:
    'It fills the element it is in. Give the app a Feedback page or panel, for example behind a Feedback item in its menu, and put it there with a height, such as the full height of that page.',
  overlay:
    "It covers the screen as soon as it is in the page. Show it from the app's own Feedback button or menu item, and take it away when it fires pleasenobugs:close.",
};

/**
 * Reusing the app's own wallet login, so its users never sign twice. Left to
 * the agent to find, because it can read the app and this page cannot; many
 * mini apps already have their users sign a login message.
 */
const APP_LOGIN = [
  "- If this app already has its users sign a login message with their Nimiq wallet (look in its code for Nimiq Pay's sign(), the Hub's signMessage() or similar), reuse it so nobody signs twice. Once the user is signed in, hand the widget that signature: document.querySelector('please-no-bugs').appLogin = { address, publicKey, signature, message } (publicKey and signature as hex, message exactly as signed), and set it to null when they sign out. The server must accept that message: PNB_PROJECT_LOGIN_MESSAGE is the message, or, if it carries something that changes every time (a date, a nonce), its fixed start followed by * (at least 12 characters before the *). Tell me what you found and what you wired.",
  '- If the app has no such login, add nothing for it: the widget asks the wallet to sign once by itself, at the first vote or post.',
].join('\n');

/**
 * The last step's first route: one prompt for the developer's AI agent,
 * whichever it is, with the code and all it needs to put it in any kind of
 * app and to get a server running.
 */
function prompt() {
  return [
    `Hi! Please add PleaseNoBugs to this app: a feedback board where its users report bugs, share ideas and write reviews, as one web component. I chose its look and settings on PleaseNoBugs' "Get your widget" page; they are in the code below.`,
    `Docs: ${REPO}`,
    '',
    '1. The server',
    'The widget talks to a PleaseNoBugs server that I run myself, so nobody else holds the feedback. First ask me whether I have one. If I do, ask me for its project id and its address: it prints both in its log every time it starts.',
    "If not, show me the four ways below side by side, briefly and without picking one for me: what each depends on and what it asks of me. Let me choose, then walk me through only that one. Whichever it is, the server is one container and every post is in one file, pleasenobugs.db, so I can move later by copying it. Each way needs the same three values: PNB_PROJECT_NAME (what users call this app), PNB_PROJECT_ORIGINS (where it runs, comma-separated, the local dev address too, like https://my.app,http://localhost:5173) and PNB_PROJECT_OWNER (my NQ... wallet address, which answers posts).",
    '- Railway. Depends on Railway; no command line. I open https://railway.com/deploy/PdvdtB, sign in and fill in the three fields, then paste you what Deploy Logs says.',
    `- This app's own backend, if it has a Node one (Node 22.13 or newer). Depends on nothing new. npx @pleasenobugs/server create-project --name "..." --origin https://... --owner "NQ...", then npx @pleasenobugs/server. Or mount it in Express: ${REPO}/tree/main/packages/server`,
    '- Docker on a server I rent (a VPS, or Coolify on one). Depends on whoever rents me the machine, and I can switch. docker-compose.yml from the repo, a .env with PNB_DOMAIN and the three values, then docker compose up -d; Caddy in it gets the HTTPS certificate by itself; the project id is in docker compose logs pleasenobugs.',
    `- My own hardware (a Raspberry Pi, a NAS). Depends on my internet connection, a domain name, and keeping it switched on. The same Docker setup, with the domain pointing at my connection and ports 80 and 443 open, or behind a Cloudflare Tunnel without Caddy: ${REPO}#readme`,
    'If the app has its own wallet login (see 2), also set PNB_PROJECT_LOGIN_MESSAGE. On a server that already runs, add it as a variable and restart it: a server with one board adds it to that board by itself.',
    'Never make up my wallet address, the project id or the server address: ask me.',
    '',
    '2. The widget',
    'Add this, with YOUR_PROJECT_ID and https://YOUR_SERVER replaced by the real values:',
    '',
    html(),
    ...(css() ? ['', "And this CSS, in the app's global stylesheet:", '', css()] : []),
    '',
    '- Plain HTML: the script once, the element where it goes.',
    `- With a bundler (React, Vue, Svelte, ...): npm install pleasenobugs@${VERSION}, import 'pleasenobugs' once at startup, and render <please-no-bugs> with the same attributes. It is a custom element: write the attributes as they are.`,
    `- The code above opens it as a round button in the corner (mode="floating"). First ask me how it should open, and adjust the code to what I pick:\n  - floating: ${PLACE.floating}\n  - inline: ${PLACE.inline}\n  - overlay: ${PLACE.overlay}`,
    `- Ask me where this app runs. Inside Nimiq Pay the wallet signs by itself. Anywhere else, such as a web app in a desktop browser, users sign with their Nimiq wallet through the Nimiq Hub: add this as well (npm install @nimiq/hub-api), with 'Your app' as this app's name; inside Nimiq Pay the check skips it. Without a signer or an app login, the board can only be read outside Nimiq Pay.\n\n${npmSignerOnly()}\n\n${APP_LOGIN}`,
    '- If it runs inside Nimiq Pay: Pay draws its own bar over the page and the widget cannot see it. If this app already measures that bar, pass it on: please-no-bugs { --pnb-inset-top: ...; --pnb-inset-bottom: ...; }',
    '- Keep the version pinned.',
    '',
    '3. Check it',
    'Start the app, open the widget and make sure the board loads. With the app login wired, a signed-in user posts and votes without signing again. Without it, the first vote or post asks the wallet to sign once: inside Nimiq Pay a short confirmation, in a browser the Nimiq Hub, which the board also offers on top as "Sign in with Nimiq". To answer posts, I sign in with the owner wallet.',
  ].join('\n');
}

// ---- Copying it ------------------------------------------------------------

const COPIES = {
  html: () => [htmlRoute(), 'Code copied'],
  npm: () => [npmSteps(), 'npm steps copied'],
  ai: () => [`${prompt()}\n`, "Prompt copied. Paste it into your agent's chat."],
};

const get = document.getElementById('get');
const peek = document.getElementById('peek');

/** The prompt and the code, kept up to date with the theme. */
function writeCode() {
  for (const el of get.querySelectorAll('[data-code]')) {
    const text = COPIES[el.dataset.code]()[0];
    if (el.dataset.code === 'ai') el.textContent = text;
    else el.innerHTML = highlight(text);
  }
}

/** The prompt or the code, opened under the button, or closed (`''`). */
function showPeek(part) {
  peek.dataset.open = part;
  peek.hidden = !part;
  for (const el of peek.querySelectorAll('[data-part]')) el.hidden = el.dataset.part !== part;
  for (const b of get.querySelectorAll('.get__more [data-peek]')) b.setAttribute('aria-expanded', String(b.dataset.peek === part));
}

get.addEventListener('click', async (e) => {
  const look = e.target.closest('[data-peek]');
  if (look) return showPeek(look.dataset.peek === peek.dataset.open ? '' : look.dataset.peek);
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const [text, saidIt] = COPIES[btn.dataset.copy]();
  try {
    await navigator.clipboard.writeText(text);
    toast(saidIt);
  } catch {
    // Blocked: show it in the page, to select by hand.
    showPeek(btn.dataset.copy === 'ai' ? 'prompt' : 'code');
    toast('Copying was blocked: select it below instead');
  }
});

let toastTimer;
function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = text;
  el.classList.add('toast--on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('toast--on'), 2200);
}

paintWidget();
writeCode();
play();
