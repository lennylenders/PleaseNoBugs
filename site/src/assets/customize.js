/**
 * Make it yours: one screen like the home page's demo, the pretend app with
 * the real widget in `demo` mode at its own place in it, and four steps:
 *
 * 1. The look: the widget's own, `pleasenobugs`, on a card that is already
 *    chosen, with a second, greyed, "More themes", coming soon.
 * 2. How it opens: the three ways side by side, each playing.
 * 3. Where it's used: Nimiq Pay, a browser or both, which decides whether the
 *    code needs a signer.
 * 4. Ready to add: a prompt for the developer's AI agent, the choices made,
 *    and the code itself for who prefers to add it by hand.
 *
 * The widget can be tried in the first three steps; the last one shows,
 * over and over, the prompt going into an AI agent and the widget turning up
 * in the app, rather than a widget that looks real but posts nowhere. A slim
 * bar along the bottom has
 * Back and Next; Next waits until the step's choice is made.
 *
 * **Everything lives in this page's memory.** Nothing is saved, not even in
 * `localStorage`: the copied code is the only place a choice ends up.
 */

/** The npm version the copied code loads, filled in from the widget's
 *  package.json by `site/files.mjs`. Pinned, so a later release never changes
 *  somebody's app without them choosing to. */
const VERSION = '%VERSION%';

const REPO = 'https://github.com/lennylenders/PleaseNoBugs';

/**
 * The steps. `screen` is the widget's `screen` attribute that puts a part in
 * view; `name` is the bar's. `panel`: the step is a wide panel over the
 * stage. The last step is `live`: the widget is itself there, every tap its
 * own, as it starts in an app.
 */
const STEPS = [
  { id: 'theme', name: 'The look', screen: 'board' },
  // The three ways side by side, each playing (`paintWays`).
  { id: 'opens', name: 'How it opens', screen: '' },
  // Where people use the app, which decides how they sign. The server and
  // the code are left to the developer's AI agent, from the last step's prompt.
  { id: 'runs', name: "Where it's used", screen: '', panel: true },
  { id: 'ready', name: "You're ready!", screen: '', live: true },
];

const screen = document.getElementById('screen');
const deck = document.getElementById('deck');
const deckBody = document.getElementById('deck-body');
const foldBtn = document.getElementById('fold');
const backBtn = document.getElementById('back');
const bar = document.getElementById('stepbar');
const barBack = document.getElementById('bar-back');
const barNext = document.getElementById('bar-next');
const viewport = screen.closest('.viewport');

/** Whether the card stands beside the widget (from 980px, as in site.css) or lies along the bottom. */
const beside = window.matchMedia('(min-width: 980px)');
/** Whether the theme cards are a band to swipe along the bottom (to 760px, as in site.css). */
const narrow = window.matchMedia('(max-width: 760px)');

const state = {
  mode: 'floating',
  /** Where the app runs: `pay` (only in Nimiq Pay), `browser` or `both`, which need a signer. */
  runs: '',
  /** The steps go on only once something is chosen (`blocked`). There is
   *  one look for now, so it is chosen already. */
  pickedTheme: true,
  pickedMode: false,
};

/** The widget's theme: its own look, the one there is for now. */
const theme = () => 'pleasenobugs';

/** Why Next waits on this step, or '' when it may go on. Said in the bar beside the step's name. */
function blocked() {
  if (at === 'opens' && !state.pickedMode) return 'Pick how it opens to go on.';
  if (at === 'runs' && !state.runs) return "Pick where it's used to go on.";
  return '';
}

/** The step on screen, by id, and whether the widget is the last step's fresh one. */
let at = 'theme';
let previewing = false;

/** The widget in the box. */
let board = null;

const step = () => STEPS.find((s) => s.id === at);

// ---- The widget ----------------------------------------------------------

/** Put the settings on the widget. The plays in "How it opens" hold theirs inline, on one screen. */
function apply(el, mode = state.mode, held = previewing ? '' : step().screen) {
  const set = (name, value) => (value ? el.setAttribute(name, value) : el.removeAttribute(name));
  el.setAttribute('demo', '');
  // Only for the identicons: the posts stay in the page.
  el.setAttribute('server', '%BOARD_SERVER%');
  el.setAttribute('mode', mode);
  set('theme', theme());
  set('screen', held);
}

/**
 * Where an inline widget sits: in the app's Feedback page, as the inline
 * play leaves it. The menu beside it on a wide screen, the page's bar over
 * it on a narrow one (site.css picks).
 */
const INLINE_FRAME = `<div class="inline-frame" aria-hidden="true">
    <nav class="dk-menu"><b>Your app</b><span>Home</span><span>Settings</span><span class="dk-menu__pick">Feedback</span><span>About</span></nav>
    <b class="ph-back">‹&nbsp; Your app</b>
  </div>`;

/** A fresh widget in the box: for a new way of opening, and for the last step, where it starts as it would in an app. */
function mount() {
  board?.remove();
  screen.querySelector('.screen__again')?.remove();
  screen.querySelector('.inline-frame')?.remove();
  screen.classList.toggle('screen--inline', state.mode === 'inline');
  if (state.mode === 'inline') screen.insertAdjacentHTML('beforeend', INLINE_FRAME);
  board = document.createElement('please-no-bugs');
  apply(board);
  screen.append(board);
  if (state.mode === 'overlay') board.addEventListener('pleasenobugs:close', offerAgain);
  fitPanel();
  observeRoot(board);
  watch();
  paintScreen();
}

/** An overlay is gone once closed; a button brings it back. */
function offerAgain() {
  const again = document.createElement('button');
  again.type = 'button';
  again.className = 'btn btn--small screen__again';
  again.textContent = 'Open it again';
  again.onclick = mount;
  screen.append(again);
}

/**
 * The widget sizes its corner panel to the window (at most 640px high), and
 * the box here is shorter: without this its top would be cut off. Only for
 * the demo in this box, so it is put in from here rather than in the widget.
 */
function fitPanel() {
  const root = board?.shadowRoot;
  if (!root) return;
  let style = root.querySelector('style[data-site]');
  if (!style) {
    style = document.createElement('style');
    style.dataset.site = '';
    root.append(style);
  }
  style.textContent = `@media (min-width: 640px) { .overlay, .overlay .app { max-height: ${screen.clientHeight - 48}px; } }`;
}

/** What stands over the app: the three ways, the theme cards or the wide panel, as the step asks. */
function paintScreen() {
  screen.classList.toggle('screen--device', at === 'opens');
  // The app's own background behind every way, inline too.
  screen.classList.toggle('screen--inline', state.mode === 'inline' && at !== 'opens');
  paintWays();
  paintThemes();
  paintPanel();
}

// ---- How it opens: the three ways side by side ---------------------------

/**
 * Each way as a card that plays it, on a phone of its own, so the three can
 * be seen at once: the round button growing into the panel, the app's menu
 * opening a page with the widget, the widget coming up over the app. The
 * plays are drawn at a phone's size and scaled to the card; the widgets in
 * them are real ones, in `demo` mode, inline and held on the tiles, and the
 * moving is CSS (`.play--…` in site.css). With reduced motion they stand
 * still, open. A tap on a card picks it. On a phone one card at a time,
 * swiped, with dots under them.
 */
const WAYS = [
  ['floating', 'Button', 'A round button in the corner of every screen.'],
  ['inline', 'Inline', 'A page of its own in your app, behind Feedback in its menu.'],
  ['overlay', 'Overlay', 'Over your app, from a button or menu item of yours.'],
];

/** The round button's glyph: a copy of `Feedback` in the widget's icons.tsx. */
const GLYPH =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 6C12 5.45 11.55 5 11 5H5.815L6.48 1.825c.015-.075.025-.155.025-.235 0-.31-.125-.59-.33-.795L5.38 0 .44 4.94C.17 5.21 0 5.585 0 6v6.5c0 .83.67 1.5 1.5 1.5h6.75c.62 0 1.155-.375 1.38-.915l2.265-5.29c.065-.17.105-.35.105-.545V6zm10.5 4h-6.75c-.62 0-1.155.375-1.38.915l-2.265 5.29c-.065.17-.105.35-.105.545V18c0 .55.45 1 1 1h5.185l-.665 3.175c-.015.075-.025.155-.025.235 0 .31.125.59.33.795L18.62 24l4.94-4.94c.27-.27.44-.645.44-1.06v-6.5c0-.83-.67-1.5-1.5-1.5z"/></svg>';

const TILES = '<please-no-bugs data-screen="tiles"></please-no-bugs>';
/** Where a finger taps: inside the thing it taps, so it is always on it. */
const TAP_A = '<span class="pl-tap pl-tap--a"></span>';
const TAP_B = '<span class="pl-tap pl-tap--b"></span>';
const CTA = `<span class="pl-cta">Send feedback${TAP_A}</span>`;

/** The pretend app, as in the other steps, with what a way needs of it. */
const app = (extra = '', burger = false) =>
  `<div class="screen__app"><b>${burger ? `<span class="ph-burger">${TAP_A}</span>` : ''}Your app</b><i></i><i></i><i></i><i></i>${extra}</div>`;

/** What each way plays. */
const PLAYS = {
  floating: `${app()}<div class="ph-open">${TILES}</div>
      <div class="ph-skin"><span class="ph-glyph">${GLYPH}</span></div>
      <span class="pl-spot">${TAP_A}</span>`,
  inline: `${app('', true)}<div class="pl-dim"></div>
      <nav class="ph-menu"><b>Your app</b><span>Home</span><span>Settings</span><span class="ph-menu__pick">Feedback${TAP_B}</span><span>About</span></nav>
      <div class="ph-page"><b class="ph-back">‹&nbsp; Your app</b>${TILES}</div>`,
  overlay: `${app(CTA)}<div class="pl-dim"></div><div class="ph-sheet">${TILES}</div>`,
};

/** The phone the plays are drawn on, before it is scaled to its card. */
const WAY_W = 320;
const ways = document.getElementById('ways');
const waysTrack = document.getElementById('ways-track');
const waysDots = document.getElementById('ways-dots');

function buildWays() {
  waysTrack.innerHTML = WAYS.map(
    ([id, name, line]) => `<button type="button" class="way" data-way="${id}" aria-pressed="false">
      <span class="way__screen" aria-hidden="true"><span class="way__device play play--phone play--${id}">${PLAYS[id]}</span></span>
      <span class="way__name">${name}</span>
      <span class="way__line">${line}</span>
    </button>`,
  ).join('');
  waysDots.innerHTML = WAYS.map(() => '<i></i>').join('');
}

function paintWays() {
  const on = at === 'opens' && !previewing;
  const coming = on && ways.hidden;
  ways.hidden = !on;
  if (!on) return;
  if (!waysTrack.children.length) buildWays();
  // Swiped, it opens on the way picked.
  if (coming) {
    const card = waysTrack.querySelector(`[data-way="${state.mode}"]`);
    waysTrack.scrollLeft = card.offsetLeft - (waysTrack.clientWidth - card.offsetWidth) / 2;
  }
  for (const card of waysTrack.children) card.setAttribute('aria-pressed', String(state.pickedMode && card.dataset.way === state.mode));
  for (const w of waysTrack.querySelectorAll('please-no-bugs')) {
    apply(w, 'inline', 'tiles');
    still(w);
  }
  for (const play of waysTrack.querySelectorAll('.way__device')) paintSkin(play);
  scaleWays();
  paintWayDots();
}

/** A widget that is only a picture: it holds still, and has no bar over its tiles (the real panel has its X there). */
function still(w) {
  if (!w.shadowRoot || w.shadowRoot.querySelector('style[data-site]')) return;
  const style = document.createElement('style');
  style.dataset.site = '';
  style.textContent = '.scroll { overflow: hidden !important; } .bar { visibility: hidden; }';
  w.shadowRoot.append(style);
}

/** The round button and the panel behind it, for a play's own drawing of them, in the widget's colours. */
function paintSkin(play) {
  const one = play.querySelector('please-no-bugs');
  if (!one) return;
  const css = getComputedStyle(one);
  for (const [mine, theirs] of [['--ph-fab', '--pnb-fab'], ['--ph-on-fab', '--pnb-on-fab'], ['--ph-bg', '--pnb-bg']]) {
    play.style.setProperty(mine, css.getPropertyValue(theirs).trim());
  }
}

/** Each phone as wide as its card. */
function scaleWays() {
  for (const s of waysTrack.querySelectorAll('.way__screen')) s.style.setProperty('--s', String(s.clientWidth / WAY_W));
}

/** Which card is in view, on a phone, where they are swiped. */
function paintWayDots() {
  const cards = [...waysTrack.children];
  if (!cards.length) return;
  const mid = waysTrack.scrollLeft + waysTrack.clientWidth / 2;
  const i = cards.reduce((best, c, n) => (Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - mid) ? n : best), 0);
  [...waysDots.children].forEach((d, n) => d.classList.toggle('on', n === i));
}

waysTrack.addEventListener('scroll', paintWayDots, { passive: true });
waysTrack.addEventListener('click', (e) => {
  const card = e.target.closest('[data-way]');
  if (card) setMode(card.dataset.way);
});
waysDots.addEventListener('click', (e) => {
  const n = [...waysDots.children].indexOf(e.target);
  if (n >= 0) waysTrack.children[n].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
});

/** Show it another way: Button, Inline or Overlay. */
function setMode(mode) {
  state.mode = mode;
  state.pickedMode = true;
  mount();
  update();
}

// ---- The look ------------------------------------------------------------

/**
 * One card, PleaseNoBugs, with a small board in its colours, chosen already:
 * the widget in the app wears it. A second card, greyed, says more themes
 * are coming: it does nothing.
 */
const themes = document.getElementById('themes');

function paintThemes() {
  const was = themes.hidden;
  themes.hidden = !(at === 'theme' && !previewing);
  if (was !== themes.hidden) requestAnimationFrame(measureDeck);
  for (const card of themes.querySelectorAll('[data-theme]')) {
    card.setAttribute('aria-pressed', String(state.pickedTheme));
  }
}

/** On a phone the cards are swiped, one at a time, with dots under them, as the three ways are. */
const themesTrack = document.getElementById('themes-track');
const themesDots = document.getElementById('themes-dots');
function paintThemeDots() {
  const cards = [...themesTrack.children];
  const mid = themesTrack.scrollLeft + themesTrack.clientWidth / 2;
  const i = cards.reduce((best, c, n) => (Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - mid) ? n : best), 0);
  [...themesDots.children].forEach((d, n) => d.classList.toggle('on', n === i));
}
themesTrack.addEventListener('scroll', paintThemeDots, { passive: true });
themesDots.addEventListener('click', (e) => {
  const n = [...themesDots.children].indexOf(e.target);
  if (n >= 0) themesTrack.children[n].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
});

themes.addEventListener('click', (e) => {
  const card = e.target.closest('[data-theme]');
  if (!card) return;
  state.pickedTheme = true;
  update();
});

// ---- Where it's used: the wide panel -------------------------------------

const panel = document.getElementById('mk-panel');

function paintPanel() {
  const on = !!step().panel && !previewing;
  panel.hidden = !on;
  for (const part of panel.querySelectorAll('[data-panel]')) part.hidden = part.dataset.panel !== at;
  for (const b of panel.querySelectorAll('[data-runs]')) b.setAttribute('aria-pressed', String(b.dataset.runs === state.runs));
}

panel.addEventListener('click', (e) => {
  const run = e.target.closest('[data-runs]');
  if (!run) return;
  state.runs = run.dataset.runs;
  update();
});

function update() {
  if (board) apply(board);
  paintScreen();
  paintSteps();
  writeCode();
  watch();
}

// ---- Steps ---------------------------------------------------------------

function go(id) {
  if (!STEPS.some((s) => s.id === id)) id = 'opens';
  at = id;
  deckBody.scrollTop = 0;
  paintSteps();
  // Into the last step and out of it, a fresh widget, as it starts in an app.
  const live = !!step().live;
  if (live !== previewing) {
    previewing = live;
    screen.classList.toggle('screen--live', live);
    // The last step has no widget to try: it plays how one gets made.
    if (live) {
      board?.remove();
      board = null;
      screen.querySelector('.inline-frame')?.remove();
      screen.querySelector('.screen__again')?.remove();
    } else mount();
    playMade(live);
  } else if (board) apply(board);
  paintScreen();
  watch();
}

/** One step back or on, from the bar or the last step's card. */
function stepBy(by) {
  const next = STEPS[STEPS.findIndex((s) => s.id === at) + by];
  if (next) go(next.id);
}
backBtn.addEventListener('click', () => stepBy(-1));
barBack.addEventListener('click', () => stepBy(-1));
barNext.addEventListener('click', () => stepBy(1));

/** The card on the last step (the code); before it only the slim bar: where you are, Back and Next. */
function paintSteps() {
  const i = STEPS.findIndex((s) => s.id === at);
  const card = !!step().live;
  deck.hidden = !card;
  bar.hidden = card;
  viewport.classList.toggle('viewport--card', card);
  deck.classList.toggle('deck--ready', card);
  document.getElementById('count').textContent = `Step ${i + 1} of ${STEPS.length}`;
  document.getElementById('short').textContent = `· ${step().name}`;
  document.getElementById('step-name').textContent = card ? 'Your widget is ready to add.' : step().name;
  document.getElementById('bars').innerHTML = STEPS.map((s, n) => `<i class="${n < i ? 'done' : n === i ? 'now' : ''}"></i>`).join('');
  document.getElementById('hint').textContent = card
    ? 'Hand your choices to your AI agent: it asks you the rest and adds it to your app.'
    : '';
  backBtn.hidden = i <= 0;
  barBack.hidden = i <= 0;
  const why = blocked();
  document.getElementById('bar-name').innerHTML =
    `<b>${step().name}</b> · ${i + 1} of ${STEPS.length}` + (why ? `<span class="stepbar__why">${why}</span>` : '');
  const after = STEPS[i + 1];
  barNext.textContent = after?.live ? 'Finish →' : 'Next →';
  barNext.disabled = !!why;
  barNext.title = why || (after ? `Next: ${after.name}` : '');
  measureDeck();
}

// ---- The card, beside the widget or folding along the bottom --------------

/** Whether the panel along the bottom is folded down to its one line. */
let folded = false;

function fold(down) {
  folded = down && !beside.matches;
  deck.classList.toggle('deck--folded', folded);
  foldBtn.setAttribute('aria-expanded', String(!folded));
  document.getElementById('fold-label').textContent = folded ? 'Show the steps' : 'Fold the steps away';
}

foldBtn.addEventListener('click', () => fold(!folded));

/**
 * The app is what the bar or the card leaves of the box, so the widget is
 * always whole above them (`--deck-h`, site.css): the bar always, the
 * card only along the bottom; beside, it takes none. The widget's panel and
 * the test arrow follow.
 */
function measureDeck() {
  foldBtn.disabled = beside.matches;
  const h = !bar.hidden ? bar.offsetHeight : deck.hidden || beside.matches ? 0 : deck.offsetHeight;
  // On a phone the theme cards are a band above the bar: the app stops above that too.
  const band = !themes.hidden && narrow.matches ? themes.offsetHeight : 0;
  // On the box, so the app, the three ways and a docked box all stop above it.
  viewport.style.setProperty('--bar-h', `${h}px`);
  viewport.style.setProperty('--deck-h', `${h + band}px`);
  fitPanel();
  scaleWays();
  watch();
}
new ResizeObserver(measureDeck).observe(deck);
new ResizeObserver(measureDeck).observe(bar);
new ResizeObserver(measureDeck).observe(themes);
narrow.addEventListener('change', measureDeck);
beside.addEventListener('change', () => {
  fold(false);
  paintSteps();
});

// ---- The last step: how it gets made --------------------------------------

/**
 * Over and over, in the app's place: the prompt goes into an AI agent, it
 * says what it did, and the widget turns up in the app, the way and in the
 * look picked, as "How it opens" plays it. In the calm style of the home
 * page's demo and Why PleaseNoBugs: classes on `.made`, moved by site.css.
 * Its time stands still while it is out of view or the tab is hidden; with
 * reduced motion it shows the widget in the app and nothing moves.
 */
const made = document.getElementById('made');
const madeApp = made.querySelector('.made__app');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
/** Bumped to stop a loop that is running: leaving the step, or starting it again. */
let madeRun = 0;
let madeSeen = false;
new IntersectionObserver(([e]) => (madeSeen = e.isIntersecting), { threshold: 0.3 }).observe(made);

/** The app with the widget in it, drawn as "How it opens" draws it. */
function paintMadeApp() {
  madeApp.innerHTML = `<span class="made__device play play--phone play--${state.mode}">${PLAYS[state.mode]}</span>`;
  for (const w of madeApp.querySelectorAll('please-no-bugs')) {
    apply(w, 'inline', 'tiles');
    customElements.whenDefined('please-no-bugs').then(() => requestAnimationFrame(() => still(w)));
  }
  requestAnimationFrame(() => {
    const device = madeApp.querySelector('.made__device');
    if (device) paintSkin(device);
    scaleMade();
  });
}

/** The phone as tall as the space allows. */
function scaleMade() {
  const h = made.clientHeight - 48;
  if (h > 0) madeApp.style.setProperty('--s', String(Math.min(1, h / 560)));
}

async function playMade(on) {
  const run = ++madeRun;
  made.hidden = !on;
  if (!on) return;
  paintMadeApp();
  const sleep = async (ms) => {
    let left = ms;
    while (left > 0) {
      await new Promise((r) => setTimeout(r, 50));
      if (run !== madeRun) throw run;
      if (madeSeen && !document.hidden) left -= 50;
    }
  };
  const show = (...names) => (made.className = ['made', ...names.map((n) => `is-${n}`)].join(' '));
  if (reduce.matches) return show('app');
  try {
    for (;;) {
      show();
      await sleep(500);
      show('chat');
      await sleep(700);
      show('chat', 'asked');
      await sleep(900);
      show('chat', 'asked', 'typing');
      await sleep(1100);
      for (let n = 1; n <= 3; n++) {
        show('chat', 'asked', `done-${n}`);
        await sleep(550);
      }
      await sleep(900);
      show('app');
      // The play's own moves start from the top each time it is shown.
      paintMadeApp();
      await sleep(6200);
      show('out');
      await sleep(600);
    }
  } catch (stopped) {
    if (stopped !== run) throw stopped;
  }
}
reduce.addEventListener('change', () => previewing && playMade(true));

/**
 * The widget moves while it opens and while it loads its posts, so for a
 * moment after anything changes the arrow follows it every frame.
 */
let following = 0;
let settle = 0;
function watch() {
  const idle = following < performance.now();
  following = performance.now() + 600;
  if (idle) requestAnimationFrame(follow);
  // Once more when it has settled, also where no frames are drawn.
  clearTimeout(settle);
  settle = setTimeout(fitPanel, 650);
}

function follow() {
  fitPanel();
  if (performance.now() < following) requestAnimationFrame(follow);
}

/** Follow the widget whenever it redraws: posts arriving, a screen changing. */
function observeRoot(el) {
  new MutationObserver(watch).observe(el.shadowRoot, { childList: true, subtree: true });
  el.shadowRoot.addEventListener('scroll', watch, true);
  el.shadowRoot.addEventListener('animationend', watch, true);
}

window.addEventListener('resize', () => {
  fitPanel();
  scaleMade();
  paintScreen();
  watch();
});
// A hidden tab draws no frames: catch up when it is back.
document.addEventListener('visibilitychange', watch);

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
/** Whether the code needs that signer: an app in a browser. */
const browser = () => state.runs === 'browser' || state.runs === 'both';

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
    `Hi! Please add PleaseNoBugs to this app: a feedback board where its users report bugs, share ideas and write reviews, as one web component. I chose its look and settings on PleaseNoBugs' "Make it yours" page; they are in the code below.`,
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
    `- ${PLACE[state.mode]}`,
    browser()
      ? `- It runs ${state.runs === 'both' ? 'in Nimiq Pay and in browsers' : 'in a browser'}, so outside Nimiq Pay users sign with their Nimiq wallet through the Nimiq Hub: add this as well (npm install @nimiq/hub-api), with 'Your app' as this app's name. Inside Nimiq Pay the wallet signs by itself, which the check keeps.\n\n${npmSignerOnly()}\n\n${APP_LOGIN}`
      : state.runs === 'pay'
        ? `- It runs only inside Nimiq Pay, where the wallet signs by itself.\n${APP_LOGIN}`
        : `- Ask me where this app runs. Inside Nimiq Pay the wallet signs by itself. Anywhere else, such as a web app in a desktop browser, give the element a signer so users can post and vote with their Nimiq wallet through the Nimiq Hub (npm install @nimiq/hub-api): ${REPO}/tree/main/packages/widget#signing-outside-nimiq-pay. Without a signer or an app login, the board can only be read there.\n${APP_LOGIN}`,
    '- If it runs inside Nimiq Pay: Pay draws its own bar over the page and the widget cannot see it. If this app already measures that bar, pass it on: please-no-bugs { --pnb-inset-top: ...; --pnb-inset-bottom: ...; }',
    '- Keep the version pinned.',
    '',
    '3. Check it',
    'Start the app, open the widget and make sure the board loads. With the app login wired, a signed-in user posts and votes without signing again. Without it, the first vote or post asks the wallet to sign once: inside Nimiq Pay a short confirmation, in a browser the Nimiq Hub, which the board also offers on top as "Sign in with Nimiq". To answer posts, I sign in with the owner wallet.',
  ].join('\n');
}

// ---- The last step: ready to add -----------------------------------------

const COPIES = {
  html: () => [htmlRoute(), 'Code copied'],
  npm: () => [npmSteps(), 'npm steps copied'],
  ai: () => [`${prompt()}\n`, "Prompt copied. Paste it into your agent's chat."],
};

const done = document.querySelector('.mk-done');

/** The prompt, the code and the choices on the last step, kept up to date with every choice. */
function writeCode() {
  for (const el of done.querySelectorAll('[data-code]')) {
    const text = COPIES[el.dataset.code]()[0];
    if (el.dataset.code === 'ai') el.textContent = text;
    else el.innerHTML = highlight(text);
  }
  paintDone();
}

/** The choices made, each with a way back to change it. */
function paintDone() {
  const rows = [
    ['Look', 'PleaseNoBugs', 'theme'],
    ['Opens as', { floating: 'A button in the corner', inline: 'A page in your app', overlay: 'Over your app' }[state.mode], 'opens'],
    ['Used in', { pay: 'Nimiq Pay', browser: 'A browser', both: 'Nimiq Pay and a browser' }[state.runs] ?? 'Not picked yet', 'runs'],
  ];
  const list = document.getElementById('mk-summary');
  list.innerHTML = rows.map(() => '<div><dt></dt><dd></dd><button type="button" class="mk-change">Change</button></div>').join('');
  list.querySelectorAll('div').forEach((row, i) => {
    row.querySelector('dt').textContent = rows[i][0];
    row.querySelector('dd').textContent = rows[i][1];
    row.querySelector('button').dataset.goto = rows[i][2];
    row.querySelector('button').setAttribute('aria-label', `Change ${rows[i][0].toLowerCase()}`);
  });
}

done.addEventListener('click', async (e) => {
  // "Change": back to that step, every choice kept.
  const back = e.target.closest('[data-goto]');
  if (back) return go(back.dataset.goto);
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const [text, said] = COPIES[btn.dataset.copy]();
  try {
    await navigator.clipboard.writeText(text);
    toast(said);
  } catch {
    // Blocked: open it in the page, to select by hand.
    for (const peek of done.querySelectorAll('.mk-peek')) peek.open = true;
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


mount();
paintSteps();
writeCode();
measureDeck();

// The page's own round button (the real board, assets/board.js) steps aside
// while the foot of the stage, where the steps' bar and Next are, is at the
// bottom of the window:
// on a phone it would sit right on Next (site.css, `.real-aside`). Anywhere
// else on the page it stays.
{
  const seen = new Map();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) seen.set(e.target, e.isIntersecting);
    document.body.classList.toggle('real-aside', [...seen.values()].some(Boolean));
    // Only the bottom of the window, where the round button sits.
  }, { rootMargin: '-85% 0px 0px 0px' });
  io.observe(bar);
  io.observe(deck);
}
