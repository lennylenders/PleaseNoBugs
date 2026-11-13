/**
 * The configurator, in steps, as one screen like the home page's demo: the
 * pretend app with the real widget in `demo` mode at its own place in it.
 * Before the steps a card says why (the intro, with its sketch of a widget
 * being coloured in); the last step's card holds the code. In between there
 * is no card: the widget is the place to work. It starts grey, as in the
 * sketch, and you tap a part of it: a line goes round it with its name, and
 * beside it opens what that part can be: colours that suit it and any colour
 * at all, its words, a tile's kinds, who sees screenshots. Nothing moves on
 * by itself. A slim bar along the bottom has Back and Next; what is not
 * coloured stays grey. The steps: the way in, the button, the tiles, then
 * the board (most of the widget's colours are on it), writing, sent.
 *
 * **Everything lives in this page's memory.** Nothing is saved, not even in
 * `localStorage`: the copied code is the only place a choice ends up.
 */

/** The npm version the copied code loads, filled in from the widget's
 *  package.json by `site/files.mjs`. Pinned, so a later release never changes
 *  somebody's app without them choosing to. */
const VERSION = '%VERSION%';

/**
 * The steps, in the order a user meets the widget. `screen` is the widget's
 * `screen` attribute that puts the part in view, and the key of what can be
 * tapped on it (`TARGETS`); `name` is the bar's. The last step is `live`: the
 * widget is itself there, every tap its own, to check every colour and word
 * on every screen before taking the code.
 */
const STEPS = [
  // Before the steps, and not one of them: why to make it yours, while a
  // sketch of the widget is made someone's beside it (`PLAYS.*.intro`).
  // Every visit, as nothing here is remembered; "Make it mine" goes on.
  {
    id: 'intro',
    name: 'Make it look like yours.',
    intro: true,
    screen: '',
    hint: 'A feedback button that fits your app is one people actually tap.',
  },
  // The three ways side by side, each playing (`paintWays`).
  { id: 'opens', name: 'How it opens', screen: '' },
  // Only for the round button (`floatingOnly`): inline and overlay have none.
  { id: 'button', name: 'The button', screen: 'button', floatingOnly: true },
  { id: 'tiles', name: 'Tiles', screen: 'tiles' },
  // The board right after the tiles: most of the widget's colours are on it.
  { id: 'board', name: 'Board', screen: 'board' },
  // `reveal`: scrolled into view once, as the send button is at the foot of a long screen.
  { id: 'writing', name: 'Writing', screen: 'write', reveal: '.send' },
  { id: 'sent', name: 'Feedback sent!', screen: 'sent' },
  { id: 'ready', name: "You're ready!", screen: '', live: true },
];

/** The last step's line: where the widget is depends on where the card is. */
const READY_HINT = {
  side: 'It works now: try it on the right. Then take it along.',
  under: 'It works now: try it above. Then take it along.',
};

/**
 * The colour families. Each is one custom property, and every part of the
 * widget painted with it changes with it: the background is the panel and the
 * answer box at once. The name says what it is, `what` where it shows, so a
 * developer knows what a dot will change before they tap it. `accent` is the
 * widget's `accent` attribute, which also picks black or white for what is
 * written on it.
 */
const FAMILIES = {
  accent: ['Send button', 'the send button, the toggle and a vote you gave'],
  '--pnb-fab': ['Button', 'the round button in the corner, nothing else'],
  '--pnb-on-fab': ['Icon', 'the sign on the round button'],
  '--pnb-bg': ['Background', 'the panel and the answer box under a post'],
  '--pnb-surface': ['Cards', 'posts, filters, the field you type in, the chosen tab'],
  '--pnb-surface-2': ['Pills', 'badges, the vote button, the toggle when off'],
  '--pnb-sunken': ['Top / New switch', 'behind its two tabs'],
  '--pnb-line': ['Lines', 'borders, empty stars, the screenshot box'],
  '--pnb-text': ['Text', 'titles and what people wrote'],
  '--pnb-text-quiet': ['Quiet text', 'dates, names, notes, counts, links'],
  '--pnb-filter': ['Filter', 'the chosen filter at the top, and the chosen status when you answer'],
  '--pnb-bug': ['Tile', 'the Bug tile and its badge'],
  '--pnb-idea': ['Tile', 'the Idea tile and its badge'],
  '--pnb-review': ['Tile', 'the Review tile and its badge'],
  // Each tile's own words and icon (the widget's `--pnb-tile-ink-*` and `--pnb-tile-glyph-*`).
  '--pnb-tile-ink-bug': ['Text', 'the words on the Bug tile'],
  '--pnb-tile-glyph-bug': ['Icon', 'the icon on the Bug tile'],
  '--pnb-tile-ink-idea': ['Text', 'the words on the Idea tile'],
  '--pnb-tile-glyph-idea': ['Icon', 'the icon on the Idea tile'],
  '--pnb-tile-ink-review': ['Text', 'the words on the Review tile'],
  '--pnb-tile-glyph-review': ['Icon', 'the icon on the Review tile'],
  '--pnb-star': ['Stars', 'the stars of a review'],
  '--pnb-planned': ['Planned', 'its badge'],
  '--pnb-done': ['Done', 'its badge and the tick on "Feedback sent!"'],
  '--pnb-declined': ['Not doing', 'its badge'],
  '--pnb-sent': ['Behind "sent"', 'the "Feedback sent!" screen'],
  '--pnb-sent-title': ['Title', 'the title on "Feedback sent!", nowhere else'],
  '--pnb-sent-note': ['Small text', 'the line and "Back to the board" on "Feedback sent!", nowhere else'],
  '--pnb-sent-check': ['Tick', 'the disc behind the tick on "Feedback sent!", nowhere else'],
};

/**
 * The colours offered beside a part, six that suit what it is, so a quick
 * pick is nearly always readable; the seventh dot is any colour at all.
 */
const PALETTES = {
  bright: ['#e5484d', '#8b5cf6', '#e9a00b', '#1fc7d4', '#21bca5', '#3b82f6'],
  ground: ['#292a56', '#1b1b24', '#173b3f', '#ffffff', '#f4f1ea', '#e8ecf5'],
  cards: ['#5656ac', '#2e2e3a', '#245a5f', '#f4f4f7', '#ffffff', '#dfe4f2'],
  ink: ['#ffffff', '#111118', '#e4e4ee', '#5a5a6b', '#c9c3ff', '#ffd98a'],
  lines: ['#6d6dc5', '#44455e', '#2f6f74', '#dcdce5', '#b9bfd3', '#ffffff'],
  sent: ['#21bca5', '#1fc7d4', '#8b5cf6', '#292a56', '#1b1b24', '#ffffff'],
};
const PALETTE_OF = {
  '--pnb-fab': 'bright',
  '--pnb-on-fab': 'ink',
  '--pnb-bug': 'bright',
  '--pnb-idea': 'bright',
  '--pnb-review': 'bright',
  '--pnb-tile-ink-bug': 'ink',
  '--pnb-tile-glyph-bug': 'ink',
  '--pnb-tile-ink-idea': 'ink',
  '--pnb-tile-glyph-idea': 'ink',
  '--pnb-tile-ink-review': 'ink',
  '--pnb-tile-glyph-review': 'ink',
  '--pnb-bg': 'ground',
  accent: 'bright',
  '--pnb-sent': 'sent',
  '--pnb-sent-check': 'bright',
  '--pnb-sent-title': 'ink',
  '--pnb-surface': 'cards',
  '--pnb-text': 'ink',
  '--pnb-line': 'lines',
};

/**
 * Every colour before it is picked: the intro sketch's greys, so the widget
 * is a sketch until it is somebody's. Light enough on dark to read.
 */
const GREY = {
  accent: '#7d7e95',
  '--pnb-fab': '#6c6d84',
  '--pnb-on-fab': 'rgba(255, 255, 255, 0.6)',
  '--pnb-bg': '#4a4b60',
  '--pnb-surface': '#5d5e75',
  '--pnb-surface-2': '#56576d',
  '--pnb-sunken': '#3d3e50',
  '--pnb-line': '#6c6d84',
  '--pnb-text': '#d4d5e0',
  '--pnb-text-quiet': '#a3a4b6',
  '--pnb-filter': '#7d7e95',
  '--pnb-bug': '#6c6d84',
  '--pnb-idea': '#6c6d84',
  '--pnb-review': '#6c6d84',
  '--pnb-tile-ink-bug': 'rgba(255, 255, 255, 0.55)',
  '--pnb-tile-glyph-bug': 'rgba(255, 255, 255, 0.55)',
  '--pnb-tile-ink-idea': 'rgba(255, 255, 255, 0.55)',
  '--pnb-tile-glyph-idea': 'rgba(255, 255, 255, 0.55)',
  '--pnb-tile-ink-review': 'rgba(255, 255, 255, 0.55)',
  '--pnb-tile-glyph-review': 'rgba(255, 255, 255, 0.55)',
  '--pnb-star': '#8a8ba0',
  '--pnb-planned': '#7d7e95',
  '--pnb-done': '#7d7e95',
  '--pnb-declined': '#7d7e95',
  '--pnb-sent': '#4a4b60',
  '--pnb-sent-title': '#d4d5e0',
  '--pnb-sent-note': '#a3a4b6',
  '--pnb-sent-check': '#6c6d84',
};

/**
 * The small colours and texts, worked out from the picked ones: a colour,
 * `null` for the theme's own, or nothing while what it comes from is still
 * grey. Only the big texts are picked; the small ones follow them.
 */
const DERIVED = {
  // The filter only shows with the filters open: it follows the text, as in the widget.
  '--pnb-filter': (c) => c['--pnb-text'],
  '--pnb-sent-note': (c) => c['--pnb-sent-title'] && `color-mix(in srgb, ${c['--pnb-sent-title']} 85%, transparent)`,
  '--pnb-text-quiet': (c) => c['--pnb-text'] && `color-mix(in srgb, ${c['--pnb-text']} 75%, transparent)`,
  '--pnb-surface-2': (c) => c['--pnb-surface'] && `color-mix(in srgb, ${c['--pnb-surface']}, ${c['--pnb-bg'] ?? GREY['--pnb-bg']} 45%)`,
  '--pnb-sunken': (c) => c['--pnb-bg'] && `color-mix(in srgb, ${c['--pnb-bg']}, #000 38%)`,
  '--pnb-star': (c) => c['--pnb-review'],
  // Each tile's words: white, as in the design, unless the tile is a light
  // one; its icon as its words.
  ...Object.fromEntries(
    ['bug', 'idea', 'review'].flatMap((k) => [
      [`--pnb-tile-ink-${k}`, (c) => c[`--pnb-${k}`] && inkOnTile(c[`--pnb-${k}`])],
      [`--pnb-tile-glyph-${k}`, (c) => c[`--pnb-tile-ink-${k}`] || (c[`--pnb-${k}`] && inkOnTile(c[`--pnb-${k}`]))],
    ]),
  ),
  // The statuses keep the theme's own, once the board has colours of its own.
  '--pnb-planned': (c) => (c['--pnb-surface'] ? null : undefined),
  '--pnb-done': (c) => (c['--pnb-surface'] ? null : undefined),
  '--pnb-declined': (c) => (c['--pnb-surface'] ? null : undefined),
};

/**
 * The words that can be changed, with the widget's own English as their
 * placeholder. A copy of `packages/widget/src/i18n.ts` for these keys only:
 * if a word changes there, change it here.
 */
const WORDS = {
  'board.title': 'Feedback',
  'board.reply': '<YOUR APP> says',
  'board.chooseTitle': 'What do you want to share?',
  'board.tileBug': 'Report a bug',
  'board.tileIdea': 'Share an idea',
  'board.tileReview': 'Write a review',
  'board.sent': 'Feedback sent!',
};

/**
 * What can be tapped, per screen, and what it opens: its `colours` (one row
 * each), its `words`, the `kinds` on offer (on a tile), who sees `shots`.
 * The first one the tap is inside wins, so the small ones come first; `*` is
 * the background around them. The dim page around the panel is the app's,
 * not the widget's: it opens nothing (`null`).
 */
const TARGETS = {
  button: [['.fab', { name: 'The button', colours: ['--pnb-fab', '--pnb-on-fab'] }]],
  tiles: [
    ['.backdrop', null],
    ['.tile--bug', { name: 'Bug tile', colours: ['--pnb-bug', '--pnb-tile-ink-bug', '--pnb-tile-glyph-bug'], words: ['board.tileBug'], kinds: true }],
    ['.tile--idea', { name: 'Idea tile', colours: ['--pnb-idea', '--pnb-tile-ink-idea', '--pnb-tile-glyph-idea'], words: ['board.tileIdea'], kinds: true }],
    ['.tile--review', { name: 'Review tile', colours: ['--pnb-review', '--pnb-tile-ink-review', '--pnb-tile-glyph-review'], words: ['board.tileReview'], kinds: true }],
    ['.choose__title', { name: 'Title', colours: ['--pnb-text'], words: ['board.chooseTitle'] }],
    ['*', { name: 'Background', colours: ['--pnb-bg'] }],
  ],
  write: [
    ['.backdrop', null],
    ['.send .btn', { name: 'Send button', colours: ['accent'] }],
    ['.shot', { name: 'Screenshots', shots: true }],
    ['.bar__title', { name: 'Title', colours: ['--pnb-text'] }],
    ['*', { name: 'Background', colours: ['--pnb-bg'] }],
  ],
  sent: [
    ['.backdrop', null],
    ['.sent__check', { name: 'Tick', colours: ['--pnb-sent-check'] }],
    ['.sent__title', { name: 'Title', colours: ['--pnb-sent-title'], words: ['board.sent'] }],
    ['*', { name: 'Background', colours: ['--pnb-sent'] }],
  ],
  board: [
    ['.backdrop', null],
    ['.bar__title', { name: 'Title', colours: ['--pnb-text'], words: ['board.title'] }],
    ['.card__reply-who', { name: 'Above your answers', words: ['board.reply'] }],
    ['.card__text, .rating__avg', { name: 'Text', colours: ['--pnb-text'] }],
    ['.search, .filter-btn', { name: 'Lines', colours: ['--pnb-line'] }],
    ['.card, .rating', { name: 'Cards', colours: ['--pnb-surface'] }],
    ['*', { name: 'Background', colours: ['--pnb-bg'] }],
  ],
};

/**
 * What is written on a colour, worked out from it as the widget does for
 * `accent`: the filter's words turn black or white with the filter.
 */
const INK = { '--pnb-filter': '--pnb-on-filter' };

/** Every custom property the steps offer, and the ones worked out from them, for putting them on the widget. */
const PROPS = [...Object.keys(FAMILIES).filter((name) => name !== 'accent'), ...Object.values(INK)];

/** The round button's colours: in the code only while there is a round button. */
const FAB = ['--pnb-fab', '--pnb-on-fab'];

/**
 * Every colour as it goes on the widget: picked, worked out from what is
 * picked, or still grey. A name left out keeps the theme's own. What is
 * written on the filter follows the filter. In the PleaseNoBugs theme the
 * round button is raised, so a colour picked for it goes a little darker
 * towards the bottom, as the theme's own does.
 */
function paint() {
  const c = state.colours;
  const out = {};
  for (const name of Object.keys(FAMILIES)) {
    if (name === 'accent') continue;
    const worked = c[name] ? undefined : DERIVED[name]?.(c);
    if (c[name]) out[name] = c[name];
    else if (worked) out[name] = worked;
    else if (worked !== null) out[name] = GREY[name];
  }
  for (const [name, ink] of Object.entries(INK)) out[ink] = readableOn(toHex(out[name]) ?? '#ffffff');
  const fab = c['--pnb-fab'];
  if (fab && theme() === 'pleasenobugs') out['--pnb-fab'] = `linear-gradient(${fab}, color-mix(in srgb, ${fab}, #000 18%))`;
  return out;
}

/** The send button's colour, the widget's `accent`: picked, or grey. */
const accent = () => state.accent || GREY.accent;

/**
 * The words on a tile: white, as on the design's bright tiles (red, purple,
 * gold, green), and dark only on a light one, like white or turquoise.
 */
function inkOnTile(color) {
  const hex = toHex(color);
  if (!hex) return '#ffffff';
  const channel = (i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return lum > 0.45 ? '#111118' : '#ffffff';
}

/**
 * Black or white, whichever reads better on `color`. A copy of `readableOn`
 * in `packages/widget/src/element.tsx`: if it changes there, change it here.
 */
function readableOn(color) {
  const hex = color.trim().replace('#', '');
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(full)) return '#ffffff';
  const channel = (i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return 1.05 / (lum + 0.05) >= (lum + 0.05) / 0.05 ? '#ffffff' : '#111118';
}

const form = document.getElementById('settings');
const screen = document.getElementById('screen');
const deck = document.getElementById('deck');
const deckBody = document.getElementById('deck-body');
const foldBtn = document.getElementById('fold');
const mark = document.getElementById('mark');
const backBtn = document.getElementById('back');
const nextBtn = document.getElementById('next');
const copyBtn = document.getElementById('copy');

/** Whether the card stands beside the widget (from 980px, as in customize.css) or lies along the bottom. */
const beside = window.matchMedia('(min-width: 980px)');

/**
 * The widget has other themes, but the configurator offers the one the site
 * wears: PleaseNoBugs' own colours, or Nimiq's with the header's style
 * switch (assets/style.js). Each colour can be changed. The code still names
 * it, so an app gets these colours and not the widget's light default.
 */
const theme = () => window.PNBStyle?.theme() ?? 'pleasenobugs';

const state = {
  mode: 'floating',
  kinds: ['bug', 'idea', 'review'],
  /** `board` (everyone, after the user's tick), `owners` or `off`. */
  screenshots: 'board',
  accent: '',
  colours: {},
  strings: {},
};

/** The step on screen, by id, and whether the widget is being tried out. */
let at = 'intro';
let previewing = false;

/** The widget in the box. */
let board = null;

/** The steps there are for the current choices: no button step without a round button. */
const route = () => STEPS.filter((s) => !s.floatingOnly || state.mode === 'floating');
const step = () => STEPS.find((s) => s.id === at);

/**
 * A part of the widget: what it opens (`what`, from `TARGETS`) and the
 * element it is, to put the line round. `tapped` is the one whose box is
 * open; `hovered` the one under the pointer, for its line alone.
 */
let tapped = null;
let hovered = null;

/** What `path` (a tap's or the pointer's, through the shadow root) is on, or null. */
function targetAt(path) {
  if (!board || !path.includes(board)) return null;
  const inside = path.filter((n) => n instanceof Element && n !== board);
  for (const [sel, what] of TARGETS[step().screen] ?? []) {
    const el = sel === '*' ? board.shadowRoot.querySelector('.app') : inside.find((n) => n.matches(sel));
    if (el || sel === '*') return what && el ? { what, el, sel } : null;
  }
  return null;
}

// ---- The widget ----------------------------------------------------------

/**
 * Put the settings on the widget: attributes, colours and texts. The device in
 * step 1 holds its widgets inline, on a screen of their own.
 */
function apply(el, mode = state.mode, held = previewing ? '' : step().screen) {
  const set = (name, value) => (value ? el.setAttribute(name, value) : el.removeAttribute(name));
  el.setAttribute('demo', '');
  el.setAttribute('mode', mode);
  set('theme', theme());
  set('lang', 'en');
  set('accent', accent());
  set('kinds', state.kinds.length === 3 ? '' : state.kinds.join(','));
  set('screenshots', state.screenshots === 'board' ? '' : state.screenshots);
  set('screen', held);
  const colours = paint();
  for (const name of PROPS) {
    if (colours[name]) el.style.setProperty(name, colours[name]);
    else el.style.removeProperty(name);
  }
  el.strings = Object.keys(state.strings).length ? { ...state.strings } : undefined;
}

/**
 * Where an inline widget sits after step 1: in the app's Feedback page, as
 * step 1's animation left it. The menu beside it on a wide screen, the
 * page's bar over it on a narrow one (site.css picks), and beside the card
 * when the card is on the left (customize.css).
 */
const INLINE_FRAME = `<div class="inline-frame" aria-hidden="true">
    <nav class="dk-menu"><b>Your app</b><span>Home</span><span>Settings</span><span class="dk-menu__pick">Feedback</span><span>About</span></nav>
    <b class="ph-back">‹&nbsp; Your app</b>
  </div>`;

/** A fresh widget in the box: for a new mode, and for the test step, where it starts as it would in an app. */
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
  paintDevice();
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
  const h = screen.clientHeight - 48;
  // It still scrolls while you colour it in: the send button is at the foot of a long screen.
  // That button is off until something is written; while you colour it in it
  // shows its colour in full, so you see what you pick.
  style.textContent =
    `@media (min-width: 640px) { .overlay, .overlay .app { max-height: ${h}px; } }` +
    (previewing ? '' : ' .send .btn:disabled { opacity: 1; cursor: pointer; }');
}

// ---- The device in step 1 ------------------------------------------------

/**
 * In Settings the box plays how the chosen way opens instead of holding the
 * widget, over and over, on the same pretend app as the other steps and at its
 * real size: the round button growing into the panel, the app's own menu
 * opening a page with the widget in it, or the widget coming up over the
 * app. Each arrives on the tiles, as the widget does. As on a computer
 * where the window is wide enough for the widget's corner panel (640px, as
 * in the widget), as on a phone below that, so each shows what really
 * happens there. The widgets in it are real ones, in `demo` mode, inline and
 * held on one screen, in your colours; the moving is CSS (`.play--…` in
 * site.css). With reduced motion it stands still, open.
 */
let device = null;
const wide = window.matchMedia('(min-width: 640px)');

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

/** What plays, per width and way. */
const PLAYS = {
  phone: {
    floating: `${app()}<div class="ph-open">${TILES}</div>
      <div class="ph-skin"><span class="ph-glyph">${GLYPH}</span></div>
      <span class="pl-spot">${TAP_A}</span>`,
    inline: `${app('', true)}<div class="pl-dim"></div>
      <nav class="ph-menu"><b>Your app</b><span>Home</span><span>Settings</span><span class="ph-menu__pick">Feedback${TAP_B}</span><span>About</span></nav>
      <div class="ph-page"><b class="ph-back">‹&nbsp; Your app</b>${TILES}</div>`,
    overlay: `${app(CTA)}<div class="pl-dim"></div><div class="ph-sheet">${TILES}</div>`,
  },
  desk: {
    floating: `${app()}<div class="pl-dim"></div>
      <div class="dk-panel dk-open">${TILES}<div class="dk-skin"><span class="dk-glyph">${GLYPH}</span></div></div>
      <span class="pl-spot">${TAP_A}</span>`,
    inline: `${app('', true)}<div class="pl-dim"></div>
      <nav class="dk-menu"><b>Your app</b><span>Home</span><span>Settings</span><span class="dk-menu__pick">Feedback${TAP_B}</span><span>About</span></nav>
      <div class="dk-feed">${TILES}</div>`,
    overlay: `${app(CTA)}<div class="pl-dim"></div><div class="dk-panel dk-rise">${TILES}</div>`,
  },
};

/**
 * The intro's drawing, in the style of the Why PleaseNoBugs page's: a sketch of the widget
 * in grey, in its real shape and at its real place, and a cursor that makes
 * it yours as the steps after it do. The round button pops up in the corner;
 * the cursor taps it, the line around a part comes up with its name, a row
 * of colours opens, the cursor picks one and the button takes it. Tapped
 * again, it opens into the panel on the tiles, and the cursor colours the
 * Bug tile, the Idea and Review tiles and the background the same way.
 * A pause, and again (`playSketch`; customize.css draws it).
 *
 * Its content is abstract, bars for words, but its shape is the widget's own
 * tiles screen: the bar with its X, the question, the wide Bug tile, Idea
 * and Review side by side, and "See the board". A panel in the corner from
 * 640px, the whole app below that, as the widget opens.
 */
const SKETCH_COLOURS = ['#e5484d', '#8b5cf6', '#e9a00b', '#1fc7d4', '#21bca5', '#292a56'];
/** What the cursor colours, in order, with the name its line shows and the colour it picks. */
const SKETCH_STEPS = [
  { part: 'button', name: 'Button', colour: 3 },
  { part: 'bug', name: 'Bug', colour: 0 },
  { part: 'idea', name: 'Idea', colour: 1, quick: true },
  { part: 'review', name: 'Review', colour: 2, quick: true },
  { part: 'panel', name: 'Background', colour: 5 },
];
const SKETCH_TILE = '<i class="sk-icon"></i><i class="sk-word"></i>';
const paintColour = (part) => `--c: ${SKETCH_COLOURS[SKETCH_STEPS.find((s) => s.part === part).colour]}`;
const INTRO_PLAY = `${app()}<div class="pl-dim"></div>
  <div class="sketch">
    <div class="sk-panel" data-sk="panel" style="${paintColour('panel')}">
      <div class="sk-bar"><i class="sk-x"></i></div>
      <i class="sk-title"></i>
      <div class="sk-tile" data-sk="bug" style="${paintColour('bug')}">${SKETCH_TILE}</div>
      <div class="sk-row">
        <div class="sk-tile" data-sk="idea" style="${paintColour('idea')}">${SKETCH_TILE}</div>
        <div class="sk-tile" data-sk="review" style="${paintColour('review')}">${SKETCH_TILE}</div>
      </div>
      <i class="sk-link"></i>
    </div>
    <span class="sk-fab" data-sk="button" style="${paintColour('button')}">${GLYPH}</span>
    <div class="sk-mark"><span class="sk-mark__tag"></span></div>
    <div class="sk-pick">${SKETCH_COLOURS.map((c) => `<i style="--c: ${c}"></i>`).join('')}<i class="sk-own"></i></div>
    <span class="sk-tap"></span>
    <span class="sk-cursor"><svg width="22" height="26" viewBox="0 0 22 26" aria-hidden="true"><path d="M2 2v19.5l5.2-4.9 3.6 7.9 3.6-1.6-3.5-7.7H18z" fill="#fff" stroke="#12132b" stroke-width="2" stroke-linejoin="round"/></svg></span>
  </div>`;
PLAYS.phone.intro = INTRO_PLAY;
PLAYS.desk.intro = INTRO_PLAY;

/**
 * Play the sketch in `root` for as long as it is on the page. With less
 * motion it shows the end, still: open and in all its colours.
 */
async function playSketch(root) {
  const sk = root.querySelector('.sketch');
  if (!sk) return;
  const panel = sk.querySelector('.sk-panel');
  const fab = sk.querySelector('.sk-fab');
  const cursor = sk.querySelector('.sk-cursor');
  const tap = sk.querySelector('.sk-tap');
  const mark = sk.querySelector('.sk-mark');
  const pick = sk.querySelector('.sk-pick');
  const parts = [...sk.querySelectorAll('[data-sk]')];
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    sk.classList.add('is-open');
    for (const el of parts) el.classList.add('is-painted');
    return;
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  /** Where an element is in the sketch, in its own pixels, whatever scales the page. */
  const at = (el) => {
    const b = el.getBoundingClientRect();
    const o = sk.getBoundingClientRect();
    const s = o.width / sk.offsetWidth || 1;
    return { x: (b.left - o.left) / s, y: (b.top - o.top) / s, w: b.width / s, h: b.height / s };
  };
  const moveTo = (x, y) => (cursor.style.transform = `translate(${x}px, ${y}px)`);
  /** A tap where the cursor is: it dips, and a ring goes out. */
  const press = async (x, y) => {
    tap.style.left = `${x}px`;
    tap.style.top = `${y}px`;
    tap.classList.remove('on');
    void tap.offsetWidth;
    tap.classList.add('on');
    cursor.classList.add('down');
    await wait(140);
    cursor.classList.remove('down');
  };
  /** The configurator's line around a part, with its name: inside the edge when there is no room outside. */
  const showMark = (r, name) => {
    const W = sk.clientWidth;
    const H = sk.clientHeight;
    const left = Math.max(2, r.x - 6);
    const top = Math.max(2, r.y - 6);
    const right = Math.min(W - 2, r.x + r.w + 6);
    const bottom = Math.min(H - 2, r.y + r.h + 6);
    Object.assign(mark.style, { left: `${left}px`, top: `${top}px`, width: `${right - left}px`, height: `${bottom - top}px` });
    mark.classList.toggle('sk-mark--in', bottom + 14 > H);
    mark.querySelector('.sk-mark__tag').textContent = name;
    mark.classList.add('on');
  };
  /** The colours, under the part, or over it where there is no room under it. */
  const placePick = (r) => {
    const W = sk.clientWidth;
    const H = sk.clientHeight;
    const pw = pick.offsetWidth;
    const ph = pick.offsetHeight;
    const below = r.y + r.h + 22;
    const top = below + ph < H - 8 ? below : Math.max(8, r.y - ph - 12);
    const left = Math.min(W - pw - 8, Math.max(8, r.x + r.w / 2 - pw / 2));
    Object.assign(pick.style, { left: `${left}px`, top: `${top}px` });
  };
  const colourIn = async (step) => {
    const el = sk.querySelector(`[data-sk="${step.part}"]`);
    const r = at(el);
    // The background is tapped where nothing else is: beside "See the board".
    const spot = step.part === 'panel' ? { x: r.x + 26, y: r.y + r.h - 30 } : { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    moveTo(spot.x, spot.y);
    await wait(step.quick ? 420 : 600);
    await press(spot.x, spot.y);
    showMark(r, step.name);
    placePick(r);
    pick.classList.add('on');
    await wait(step.quick ? 300 : 450);
    const dot = pick.children[step.colour];
    const d = at(dot);
    moveTo(d.x + d.w / 2, d.y + d.h / 2);
    await wait(step.quick ? 380 : 520);
    await press(d.x + d.w / 2, d.y + d.h / 2);
    dot.classList.add('chosen');
    el.classList.add('is-painted');
    await wait(step.quick ? 520 : 760);
    pick.classList.remove('on');
    mark.classList.remove('on');
    dot.classList.remove('chosen');
    await wait(220);
  };

  while (sk.isConnected) {
    await wait(400);
    sk.classList.add('is-fab');
    await wait(500);
    // In from the open middle of the app.
    moveTo(sk.clientWidth * 0.55, sk.clientHeight * 0.42);
    sk.classList.add('is-cursor');
    await wait(300);
    await colourIn(SKETCH_STEPS[0]);
    // Tapped again, the button opens.
    const f = at(fab);
    moveTo(f.x + f.w / 2, f.y + f.h / 2);
    await wait(450);
    await press(f.x + f.w / 2, f.y + f.h / 2);
    sk.classList.add('is-open');
    await wait(800);
    for (const step of SKETCH_STEPS.slice(1)) {
      if (!sk.isConnected) return;
      await colourIn(step);
    }
    sk.classList.remove('is-cursor');
    await wait(2600);
    // Out, back to the start while it cannot be seen, and in again.
    sk.classList.add('is-away');
    await wait(400);
    sk.classList.add('sk--reset');
    sk.classList.remove('is-fab', 'is-open');
    for (const el of parts) el.classList.remove('is-painted');
    moveTo(sk.clientWidth * 0.55, sk.clientHeight * 0.42);
    void sk.offsetWidth;
    sk.classList.remove('sk--reset', 'is-away');
  }
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

/** Before the steps the box plays the intro's sketch; in "How it opens" the three ways stand over it. */
function paintDevice() {
  const mode = !previewing && at === 'intro' ? 'intro' : null;
  const kind = wide.matches ? 'desk' : 'phone';
  screen.classList.toggle('screen--device', !!mode || at === 'opens');
  // The app's own background behind every way, inline too.
  screen.classList.toggle('screen--inline', state.mode === 'inline' && !mode && at !== 'opens');
  if (device && device.dataset.key !== `${kind} ${mode}`) {
    device.remove();
    device = null;
  }
  paintWays();
  if (!mode) return;
  if (!device) {
    device = document.createElement('div');
    device.className = `play play--${kind} play--${mode}`;
    device.dataset.key = `${kind} ${mode}`;
    device.setAttribute('aria-hidden', 'true');
    device.innerHTML = PLAYS[kind][mode];
    screen.append(device);
    playSketch(device);
  }
}

// ---- How it opens: the three ways side by side ---------------------------

/**
 * Each way as a card that plays it, on a phone of its own, so the three can
 * be seen at once: the round button growing into the panel, the app's menu
 * opening a page with the widget, the widget coming up over the app. The
 * plays are the phone ones (site.css), drawn at a phone's size and scaled
 * to the card. A tap on a card picks it. On a phone one card at a time,
 * swiped, with dots under them.
 */
const WAYS = [
  ['floating', 'Button', 'A round button in the corner of every screen.'],
  ['inline', 'Inline', 'A page of its own in your app, behind Feedback in its menu.'],
  ['overlay', 'Overlay', 'Over your app, from a button or menu item of yours.'],
];
/** The phone the plays are drawn on, before it is scaled to its card. */
const WAY_W = 320;
const WAY_H = 560;
const ways = document.getElementById('ways');
const waysTrack = document.getElementById('ways-track');
const waysDots = document.getElementById('ways-dots');

function buildWays() {
  waysTrack.innerHTML = WAYS.map(
    ([id, name, line]) => `<button type="button" class="way" data-way="${id}" aria-pressed="false">
      <span class="way__screen" aria-hidden="true"><span class="way__device play play--phone play--${id}">${PLAYS.phone[id]}</span></span>
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
  for (const card of waysTrack.children) card.setAttribute('aria-pressed', String(card.dataset.way === state.mode));
  for (const w of waysTrack.querySelectorAll('please-no-bugs')) {
    apply(w, 'inline', 'tiles');
    still(w);
  }
  for (const play of waysTrack.querySelectorAll('.way__device')) paintSkin(play);
  scaleWays();
  paintWayDots();
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

/** Show it another way: Button, Inline or Overlay. The button's step comes or goes with it. */
function setMode(mode) {
  state.mode = mode;
  mount();
  update();
}

// The header's style switch: the widgets and the code take the other theme.
document.addEventListener('pnb:style', () => update());

function update() {
  if (board) apply(board);
  paintDevice();
  paintSteps();
  paintPick();
  writeCode();
  // The line and the box move at once, then follow the widget a moment.
  placeMark();
  watch();
}

// ---- Steps ---------------------------------------------------------------

function go(id) {
  if (!route().some((s) => s.id === id)) id = 'opens';
  const forward = route().findIndex((s) => s.id === id) > route().findIndex((s) => s.id === at);
  at = id;
  tapped = null;
  hovered = null;
  for (const el of form.querySelectorAll('[data-step]')) el.hidden = el.dataset.step !== at;
  paintSteps();
  // Each step starts at its top.
  deckBody.scrollTop = 0;
  // Into the last step and out of it, a fresh widget, as it starts in an app.
  const live = !!step().live;
  if (live !== previewing) {
    previewing = live;
    // Each time the last step is reached, the arrow shows where to test it.
    tried = false;
    screen.classList.toggle('screen--live', live);
    mount();
    if (live && forward) cheer("You're ready!");
  } else if (board) apply(board);
  paintDevice();
  paintPick();
  watch();
}

const bar = document.getElementById('stepbar');
const barBack = document.getElementById('bar-back');
const barNext = document.getElementById('bar-next');
const viewport = screen.closest('.viewport');

/**
 * The card before the steps (why) and on the last one (the code); in
 * between only the slim bar: where you are, Back and Next. Next is always
 * there: what is not coloured stays grey.
 */
function paintSteps() {
  // The intro is before the steps, not one of them.
  const steps = route().filter((s) => !s.intro);
  const i = steps.findIndex((s) => s.id === at);
  const card = !!step().intro || !!step().live;
  deck.hidden = !card;
  bar.hidden = card;
  viewport.classList.toggle('viewport--card', card);
  deck.classList.toggle('deck--intro', !!step().intro);
  deck.classList.toggle('deck--ready', !!step().live);
  document.getElementById('count').textContent = `Step ${i + 1} of ${steps.length}`;
  document.getElementById('short').textContent = `· ${step().name}`;
  document.getElementById('step-name').textContent = step().name;
  document.getElementById('bars').innerHTML = steps
    .map((s, n) => `<i class="${n < i ? 'done' : n === i ? 'now' : ''}"></i>`)
    .join('');
  document.getElementById('hint').textContent = step().live
    ? READY_HINT[beside.matches ? 'side' : 'under']
    : (step().hint ?? '');
  backBtn.hidden = i <= 0;
  nextBtn.hidden = true;
  document.getElementById('bar-name').innerHTML = `<b>${step().name}</b> · ${i + 1} of ${steps.length}`;
  const after = steps[i + 1];
  barNext.textContent = after?.live ? 'Done →' : 'Next →';
  barNext.title = after ? `Next: ${after.name}` : '';
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
document.getElementById('start').addEventListener('click', () => go('opens'));

/**
 * The app is what the bar or the card leaves of the box, so the widget is
 * always whole above them (`--deck-h`, customize.css): the bar always, the
 * card only along the bottom; beside, it takes none. The widget's panel and
 * the line around its part follow.
 */
function measureDeck() {
  foldBtn.disabled = beside.matches;
  const h = !bar.hidden ? bar.offsetHeight : deck.hidden || beside.matches ? 0 : deck.offsetHeight;
  // On the box, so the app, the three ways and a docked box all stop above it.
  viewport.style.setProperty('--deck-h', `${h}px`);
  fitPanel();
  scaleWays();
  watch();
}
new ResizeObserver(measureDeck).observe(deck);
new ResizeObserver(measureDeck).observe(bar);
beside.addEventListener('change', () => {
  fold(false);
  paintSteps();
});

// ---- You're ready --------------------------------------------------------

/** How long the cheer holds before it clears itself, as in Shitti. */
const CHEER_MS = 2600;
/** How many pieces of paper, how far the fastest fly out, and how far all of them sink. */
const PIECES = 44;
const SPREAD = 190;
const FALL = 320;
/** The site's palette, and the tiles'. */
const PAPER = ['#1fc7d4', '#21bca5', '#e9a00b', '#e5484d', '#8b5cf6', '#ffffff'];

/**
 * One line of good news over the whole page, with a burst of paper from its
 * middle: Shitti's fanfare, the one it shows when you invite somebody. Every
 * time the last step is reached going forward: the widget is done. It holds
 * a moment and clears itself; a tap clears it sooner. With reduced motion
 * the line alone, briefly.
 *
 * Each piece gets its own angle, reach and spin, so they are thrown with the
 * Web Animations API rather than forty-odd one-off keyframes.
 */
function cheer(line) {
  document.querySelector('.fanfare')?.remove();
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = document.createElement('div');
  el.className = 'fanfare';
  el.setAttribute('role', 'status');
  el.innerHTML = '<div class="fanfare__paper" aria-hidden="true"></div><p class="fanfare__line"></p>';
  el.querySelector('.fanfare__line').textContent = line;
  const paper = el.querySelector('.fanfare__paper');
  const done = () => el.remove();
  el.addEventListener('click', done);
  document.body.append(el);
  setTimeout(done, still ? 600 : CHEER_MS);
  if (still) return;
  const life = CHEER_MS - 200;
  for (let i = 0; i < PIECES; i++) {
    const bit = document.createElement('i');
    if (i % 3 === 0) bit.className = 'round';
    bit.style.background = PAPER[i % PAPER.length];
    paper.append(bit);
    // Even all round, jittered, so it is a burst and not the spokes of a wheel.
    const angle = (i / PIECES) * Math.PI * 2 + Math.random() * 0.6;
    const reach = SPREAD * (0.45 + Math.random() * 0.55);
    const dx = Math.cos(angle) * reach;
    const dy = Math.sin(angle) * reach;
    const spin = (Math.random() - 0.5) * 1080;
    bit.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1, offset: 0 },
        // The throw peaks early; after that it falls.
        { transform: `translate(${dx}px, ${dy}px) rotate(${spin * 0.4}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx * 1.15}px, ${dy + FALL}px) rotate(${spin}deg)`, opacity: 0, offset: 1 },
      ],
      { duration: life * (0.55 + Math.random() * 0.45), easing: 'cubic-bezier(0.15, 0.6, 0.35, 1)', fill: 'forwards' },
    );
  }
}

/** One step back or on, from the bar or the last step's card. */
function stepBy(by) {
  const steps = route();
  const next = steps[steps.findIndex((s) => s.id === at) + by];
  if (next) go(next.id);
}
backBtn.addEventListener('click', () => stepBy(-1));
nextBtn.addEventListener('click', () => stepBy(1));
barBack.addEventListener('click', () => stepBy(-1));
barNext.addEventListener('click', () => stepBy(1));

// ---- Tapping a part ------------------------------------------------------

/**
 * A tap in the widget picks a part instead of using it. It is read when the
 * pointer comes up, as a disabled button (send, before anything is written)
 * gets no click; the click itself is caught on its way down, before the
 * widget's own buttons hear it. A drag (scrolling the widget) picks nothing.
 * A tap beside the widget closes what is open. In the last step the widget
 * has its taps to itself.
 */
let downAt = null;
function tapAt(path) {
  if (!path.includes(board)) return closePick();
  const t = targetAt(path);
  if (t) openTarget(t);
  else closePick();
}
screen.addEventListener('pointerdown', (e) => (downAt = { x: e.clientX, y: e.clientY }), true);
screen.addEventListener(
  'pointerup',
  (e) => {
    if (previewing || !board || !downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved < 8) tapAt(e.composedPath());
  },
  true,
);
screen.addEventListener(
  'click',
  (e) => {
    if (previewing || !board) return;
    const path = e.composedPath();
    if (!path.includes(board)) return;
    e.preventDefault();
    e.stopPropagation();
    // From the keyboard there was no pointer: the click is the tap.
    if (e.detail === 0) tapAt(path);
  },
  true,
);

/** With a mouse, the line and the part's name follow the pointer: what a tap would open. */
screen.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || previewing) return;
  const t = targetAt(e.composedPath());
  if (t?.el === hovered?.el) return;
  hovered = t;
  placeMark();
});
screen.addEventListener('pointerleave', () => {
  hovered = null;
  placeMark();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && tapped) closePick();
});

function openTarget(t) {
  tapped = t;
  hovered = null;
  fillPick();
  paintPick();
  placeMark();
  watch();
}

function closePick() {
  if (!tapped) return;
  tapped = null;
  pick.hidden = true;
  pick.dataset.key = '';
  placeMark();
}

// ---- The line around the part --------------------------------------------

/**
 * Draw the line around the part tapped, or else the one under the pointer.
 * The widget moves while it opens and while it loads its posts, so for a
 * moment after anything changes the line follows it every frame.
 */
let following = 0;
let settle = 0;
function watch() {
  const idle = following < performance.now();
  following = performance.now() + 600;
  if (idle) requestAnimationFrame(follow);
  // Once more when it has settled, also where no frames are drawn.
  clearTimeout(settle);
  settle = setTimeout(placeMark, 650);
}

function follow() {
  placeMark();
  if (performance.now() < following) requestAnimationFrame(follow);
}

/** The part a step scrolls into view once it is drawn (`reveal`), and for which step. */
let revealed = null;

// ---- You're ready: test it ----------------------------------------------

/**
 * In the last step an arrow points at the widget, "Test your widget": at the
 * round button in the corner, or at the panel when it is shown inline or
 * over the app. It comes in after the cheer and goes once the widget is
 * touched, as by then it has been found.
 */
const tryHint = document.getElementById('try');
let tried = false;

function paintTry() {
  const root = board?.shadowRoot;
  const part = previewing && !tried && root ? (root.querySelector('.fab:not(.fab--away)') ?? root.querySelector('.app')) : null;
  const r = part?.getBoundingClientRect();
  if (!r || !r.width) {
    tryHint.hidden = true;
    return;
  }
  const vb = viewport.getBoundingClientRect();
  tryHint.hidden = false;
  // Up and to the left of it, the arrow's tip just off its left side.
  tryHint.style.right = `${vb.right - r.left + 4}px`;
  tryHint.style.bottom = `${vb.bottom - r.top - Math.min(r.height / 2, 20)}px`;
}

screen.addEventListener(
  'pointerdown',
  (e) => {
    if (!previewing || tried || !board || !e.composedPath().includes(board)) return;
    tried = true;
    paintTry();
  },
  true,
);

function placeMark() {
  paintTry();
  const root = board?.shadowRoot;
  if (root && !previewing && step().reveal && revealed !== at) {
    const part = root.querySelector(step().reveal);
    const scroller = part?.closest('.scroll');
    if (scroller) {
      revealed = at;
      scroller.scrollTop += part.getBoundingClientRect().bottom + 16 - scroller.getBoundingClientRect().bottom;
    }
  }
  const t = previewing || !root ? null : (tapped ?? hovered);
  // A widget that drew itself again has new elements: find the part anew.
  if (t && !t.el?.isConnected) t.el = t.sel === '*' ? root.querySelector('.app') : root.querySelector(t.sel);
  const r = t?.el?.getBoundingClientRect();
  if (!r || !r.width || !r.height) {
    mark.hidden = true;
    // A tile switched off is gone, but its box stays open where it was.
    if (!tapped) pick.hidden = true;
    return;
  }
  const box = screen.getBoundingClientRect();
  const pad = 6;
  const left = Math.max(box.left, r.left - pad);
  const top = Math.max(box.top, r.top - pad);
  const right = Math.min(box.right, r.right + pad);
  const bottom = Math.min(box.bottom - 2, r.bottom + pad);
  mark.hidden = false;
  mark.classList.toggle('mark--hover', !tapped);
  mark.style.left = `${left - box.left}px`;
  mark.style.top = `${top - box.top}px`;
  mark.style.width = `${right - left}px`;
  mark.style.height = `${Math.max(0, bottom - top)}px`;
  // A small part at the right edge, like the round button, keeps its tag inside the box.
  mark.classList.toggle('mark--right', right - left < 160 && right > box.left + box.width / 2);
  // A part as big as the box, like the background, keeps its tag inside it.
  mark.classList.toggle('mark--in', bottom > box.bottom - 30);
  mark.classList.toggle('mark--small', right - left < 90 && bottom - top < 90);
  document.getElementById('mark-tag').textContent = t.what.name;
  if (tapped) placePick({ left, top, right, bottom }, box);
}

// ---- What a tapped part can be -------------------------------------------

const pick = document.getElementById('pick');
const KIND_NAMES = { bug: 'Bugs', idea: 'Ideas', review: 'Reviews' };
const SHOTS = [
  ['board', 'Everyone'],
  ['owners', 'Only you'],
  ['off', 'Off'],
];

/**
 * The box for the tapped part: a row of colours per colour it has (six that
 * suit it, then any colour at all), its words, the kinds on offer on a tile,
 * who sees screenshots on the screenshot box. Built once per part, so a
 * field keeps its focus while the widget changes under it.
 */
function fillPick() {
  const { what } = tapped;
  const key = `${at} ${what.name}`;
  if (pick.dataset.key === key) return;
  pick.dataset.key = key;
  pick.setAttribute('aria-label', what.name);
  const rows = (what.colours ?? [])
    .map((name) => {
      const [label] = FAMILIES[name];
      const dots = PALETTES[PALETTE_OF[name]]
        .map((c) => `<button type="button" class="pick__dot" data-pick="${c}" style="--c: ${c}" aria-label="${label}: ${c}"></button>`)
        .join('');
      return `<div class="pick__row" data-for="${name}">
        ${what.colours.length > 1 ? `<span class="pick__label">${label}</span>` : ''}
        <div class="pick__dots">${dots}<label class="pick__own" title="Your own colour"><input type="color" data-own aria-label="Your own colour for ${label}" /></label></div>
      </div>`;
    })
    .join('');
  const words = (what.words ?? [])
    .map(
      (k) => `<label class="pick__field"><span>Words</span>
        <input class="input" data-string="${k}" maxlength="80" placeholder="${attr(WORDS[k])}" value="${attr(state.strings[k] ?? '')}" /></label>`,
    )
    .join('');
  const kinds = what.kinds
    ? `<div class="pick__field"><span>Tiles</span><div class="checks">${Object.entries(KIND_NAMES)
        .map(([k, l]) => `<label class="check"><input type="checkbox" data-kind="${k}" />${l}</label>`)
        .join('')}</div></div>`
    : '';
  const shots = what.shots
    ? `<div class="pick__field"><span>Who sees screenshots</span><div class="seg">${SHOTS.map(
        ([v, l]) => `<label><input type="radio" name="pick-shots" value="${v}" /><span>${l}</span></label>`,
      ).join('')}</div></div>`
    : '';
  pick.innerHTML = `<div class="pick__head"><b>${what.name}</b><button type="button" class="pick__x" data-close aria-label="Close">&times;</button></div>${rows}${words}${kinds}${shots}`;
}

/** Show in the box what each colour, kind and choice is now. */
function paintPick() {
  if (!tapped) return;
  for (const row of pick.querySelectorAll('[data-for]')) {
    const name = row.dataset.for;
    const value = (name === 'accent' ? state.accent : state.colours[name]) || '';
    const own = !!value && !PALETTES[PALETTE_OF[name]].includes(value);
    for (const b of row.querySelectorAll('[data-pick]')) b.classList.toggle('is-on', b.dataset.pick === value);
    row.querySelector('.pick__own').classList.toggle('is-on', own);
    row.querySelector('[data-own]').value = toHex(value) ?? '#888888';
  }
  for (const k of pick.querySelectorAll('[data-kind]')) k.checked = state.kinds.includes(k.dataset.kind);
  for (const s of pick.querySelectorAll('[name=pick-shots]')) s.checked = s.value === state.screenshots;
}

/**
 * The box beside the part: under it, over it, or to its side, wherever it
 * fits in the box, else inside the part's foot. On a phone it lies along
 * the bottom of the screen, over the widget, where a thumb is.
 */
function placePick(r, box) {
  pick.hidden = false;
  const narrow = box.width < 640;
  pick.classList.toggle('pick--docked', narrow);
  if (narrow) {
    pick.style.left = '';
    pick.style.top = '';
    return;
  }
  const pw = pick.offsetWidth;
  const ph = pick.offsetHeight;
  const gap = 18;
  const fitsX = (x) => x >= box.left + 8 && x + pw <= box.right - 8;
  const fitsY = (y) => y >= box.top + 8 && y + ph <= box.bottom - 8;
  const midX = Math.min(box.right - pw - 8, Math.max(box.left + 8, (r.left + r.right) / 2 - pw / 2));
  const midY = Math.min(box.bottom - ph - 8, Math.max(box.top + 8, (r.top + r.bottom) / 2 - ph / 2));
  const spots = [
    [midX, r.bottom + gap],
    [midX, r.top - ph - gap],
    [r.left - pw - gap, midY],
    [r.right + gap, midY],
  ];
  const [x, y] = spots.find(([sx, sy]) => fitsX(sx) && fitsY(sy)) ?? [midX, Math.max(box.top + 8, r.bottom - ph - 40)];
  pick.style.left = `${x - box.left}px`;
  pick.style.top = `${y - box.top}px`;
}

/** Give a part a colour. Nothing moves on: try another, or tap the next part. */
function setColour(part, value) {
  if (part === 'accent') state.accent = value;
  else state.colours[part] = value;
  update();
}

pick.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) return closePick();
  const dot = e.target.closest('[data-pick]');
  if (dot) setColour(dot.closest('[data-for]').dataset.for, dot.dataset.pick);
});
pick.addEventListener('input', (e) => {
  const t = e.target;
  if (t.matches('[data-own]')) setColour(t.closest('[data-for]').dataset.for, t.value);
  else if (t.matches('[data-string]')) {
    if (t.value.trim()) state.strings[t.dataset.string] = t.value;
    else delete state.strings[t.dataset.string];
    update();
  }
});
pick.addEventListener('change', (e) => {
  const t = e.target;
  if (t.matches('[data-kind]')) {
    const on = [...pick.querySelectorAll('[data-kind]:checked')].map((i) => i.dataset.kind);
    // At least one kind: a board nobody can write on is no board.
    if (!on.length) {
      t.checked = true;
      return toast('Keep at least one kind');
    }
    state.kinds = on;
    update();
  } else if (t.name === 'pick-shots') {
    state.screenshots = t.value;
    update();
  }
});

/** Follow the widget whenever it redraws: posts arriving, a screen changing. */
function observeRoot(el) {
  new MutationObserver(watch).observe(el.shadowRoot, { childList: true, subtree: true });
  el.shadowRoot.addEventListener('scroll', watch, true);
  el.shadowRoot.addEventListener('animationend', watch, true);
}

window.addEventListener('resize', () => {
  fitPanel();
  paintDevice();
  watch();
});
// A hidden tab draws no frames: catch up when it is back.
document.addEventListener('visibilitychange', watch);

// ---- Kinds ---------------------------------------------------------------

/** The colours and words that belong to one kind: gone with it when it is unticked. */
const KIND_OF = {
  '--pnb-bug': 'bug',
  '--pnb-idea': 'idea',
  '--pnb-review': 'review',
  '--pnb-star': 'review',
  '--pnb-tile-ink-bug': 'bug',
  '--pnb-tile-glyph-bug': 'bug',
  '--pnb-tile-ink-idea': 'idea',
  '--pnb-tile-glyph-idea': 'idea',
  '--pnb-tile-ink-review': 'review',
  '--pnb-tile-glyph-review': 'review',
  'board.tileBug': 'bug',
  'board.tileIdea': 'idea',
  'board.tileReview': 'review',
};

/** Whether a colour or a word is for a kind that is left off. */
const offKind = (name) => !!KIND_OF[name] && !state.kinds.includes(KIND_OF[name]);

/** `#abc`, `#aabbcc`, `rgb(...)` or the first colour in a gradient, as `#aabbcc`. */
function toHex(v) {
  if (!v) return null;
  const hex = v.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return `#${h.toLowerCase()}`;
  }
  const rgb = v.match(/rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i);
  if (rgb) return `#${rgb.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
  return null;
}

// ---- The code ------------------------------------------------------------

const attr = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function html() {
  const attrs = [
    ['project', 'YOUR_PROJECT_ID'],
    ['server', 'https://YOUR_SERVER'],
    state.mode !== 'inline' && ['mode', state.mode],
    ['theme', theme()],
    ['accent', accent()],
    state.kinds.length < 3 && ['kinds', state.kinds.join(',')],
    state.screenshots !== 'board' && ['screenshots', state.screenshots],
  ].filter(Boolean);
  const lines = [
    `<script src="https://unpkg.com/pleasenobugs@${VERSION}"></script>`,
    `<please-no-bugs`,
    ...attrs.map(([k, v]) => `  ${k}="${attr(v)}"`),
    `></please-no-bugs>`,
  ];
  // A kind left off takes its words out of the code too.
  const strings = Object.fromEntries(Object.entries(state.strings).filter(([k]) => !offKind(k)));
  if (Object.keys(strings).length) {
    // Safe inside a <script>: no "</script>" can come out of this.
    const json = JSON.stringify(strings, null, 2).replace(/</g, '\\u003c').replace(/\n/g, '\n  ');
    lines.push('<script>', `  document.querySelector('please-no-bugs').strings = ${json};`, '</script>');
  }
  return lines.join('\n');
}

function css() {
  // Every colour as it is on the widget: picked, worked out, or grey, as
  // grey stays grey. A kind left off takes its colours out of the code, kept
  // here for if it comes back; so does the round button when it is shown
  // another way.
  const rows = Object.entries(paint())
    .filter(([k]) => !offKind(k) && (state.mode === 'floating' || !FAB.includes(k)))
    .map(([k, v]) => `  ${k}: ${v};`);
  if (state.mode === 'inline') rows.unshift('  height: 600px; /* inline: give it a height, or it grows with its posts */');
  if (!rows.length) return "/* No colours changed: PleaseNoBugs' own are used. */";
  return ['please-no-bugs {', ...rows, '}'].join('\n');
}

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

function writeCode() {
  document.querySelector('#code-html code').innerHTML = highlight(html());
  document.querySelector('#code-css code').innerHTML = highlight(css());
  document.getElementById('prompt').textContent = prompt();
}

// ---- The prompt ----------------------------------------------------------

/**
 * The last step's first route: one prompt for the developer's AI agent,
 * whichever it is, with the code above and all it needs to put it in any
 * kind of app and to get a server running.
 */
const FEED = 'Feed it to your AI agent';
/** While the button says "Fed!". */
let fed = 0;
const feedBtn = document.getElementById('feed');

/** Where the element goes, per way of showing it. */
const PLACE = {
  floating: 'It draws a round button in the bottom-right corner by itself. Put the element once, near the root, so it is on every screen.',
  inline:
    'It fills the element it is in. Give the app a Feedback page or panel, for example behind a Feedback item in its menu, and put it there with a height, such as the full height of that page.',
  overlay:
    "It covers the screen as soon as it is in the page. Show it from the app's own Feedback button or menu item, and take it away when it fires pleasenobugs:close.",
};

const REPO = 'https://github.com/lennylenders/PleaseNoBugs';

function prompt() {
  const style = css().startsWith('/*') ? '' : css();
  const strings = Object.keys(state.strings).some((k) => !offKind(k));
  return [
    `Hi! Please add PleaseNoBugs to this app: a feedback board where its users report bugs, share ideas and write reviews, as one web component. I chose its look and settings on PleaseNoBugs' customize page; they are in the code below.`,
    `Docs: ${REPO}`,
    '',
    '1. The server',
    'The widget talks to a PleaseNoBugs server that I run myself, so nobody else holds the feedback. First ask me whether I have one. If I do, ask me for its project id and its address: it prints both in its log every time it starts.',
    "If not, show me the four ways below side by side, briefly and without picking one for me: what each depends on and what it asks of me. Let me choose, then walk me through only that one. Whichever it is, the server is one container and every post is in one file, pleasenobugs.db, so I can move later by copying it. Each way needs the same three values: PNB_PROJECT_NAME (what users call this app), PNB_PROJECT_ORIGINS (where it runs, comma-separated, the local dev address too, like https://my.app,http://localhost:5173) and PNB_PROJECT_OWNER (my NQ... wallet address, which answers posts).",
    '- Railway. Depends on Railway; no command line. I open https://railway.com/deploy/PdvdtB, sign in and fill in the three fields, then paste you what Deploy Logs says.',
    `- This app's own backend, if it has a Node one (Node 22.13 or newer). Depends on nothing new. npx @pleasenobugs/server create-project --name "..." --origin https://... --owner "NQ...", then npx @pleasenobugs/server. Or mount it in Express: ${REPO}/tree/main/packages/server`,
    '- Docker on a server I rent (a VPS, or Coolify on one). Depends on whoever rents me the machine, and I can switch. docker-compose.yml from the repo, a .env with PNB_DOMAIN and the three values, then docker compose up -d; Caddy in it gets the HTTPS certificate by itself; the project id is in docker compose logs pleasenobugs.',
    `- My own hardware (a Raspberry Pi, a NAS). Depends on my internet connection, a domain name, and keeping it switched on. The same Docker setup, with the domain pointing at my connection and ports 80 and 443 open, or behind a Cloudflare Tunnel without Caddy: ${REPO}#readme`,
    'Never make up my wallet address, the project id or the server address: ask me.',
    '',
    '2. The widget',
    'Add this, with YOUR_PROJECT_ID and https://YOUR_SERVER replaced by the real values:',
    '',
    html(),
    ...(style ? ['', "And this CSS, in the app's global stylesheet:", '', style] : []),
    '',
    '- Plain HTML: the script once, the element where it goes.',
    `- With a bundler (React, Vue, Svelte, ...): npm install pleasenobugs@${VERSION}, import 'pleasenobugs' once at startup, and render <please-no-bugs> with the same attributes. It is a custom element: write the attributes as they are.`,
    ...(strings ? ["- The texts I changed go on the element's strings property, as in the code; in a framework, set it from a ref once it is rendered."] : []),
    `- ${PLACE[state.mode]}`,
    `- Ask me where this app runs. Inside Nimiq Pay the wallet signs by itself: nothing to add. Anywhere else, such as a web app in a desktop browser, give the element a signer so users can post and vote with their Nimiq wallet through the Nimiq Hub (npm install @nimiq/hub-api): ${REPO}/tree/main/packages/widget#signing-outside-nimiq-pay. If the app already signs users in with their Nimiq wallet, reuse that login instead: ${REPO}/tree/main/packages/widget#reusing-your-apps-own-login. Without either, the board can only be read.`,
    '- If it runs inside Nimiq Pay: Pay draws its own bar over the page and the widget cannot see it. If this app already measures that bar, pass it on: please-no-bugs { --pnb-inset-top: ...; --pnb-inset-bottom: ...; }',
    '- Keep the version pinned.',
    '',
    '3. Check it',
    'Start the app, open the widget and make sure the board loads. Posting or voting asks the wallet to sign; inside Nimiq Pay that happens by itself, in a browser the Nimiq Hub opens. To answer posts, I open it with the owner wallet and tap "Sign in with your wallet" at the foot of the board.',
  ].join('\n');
}

feedBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(`${prompt()}\n`);
  } catch {
    // Blocked: the prompt is in the page, to select by hand.
    document.querySelector('.peek').open = true;
    return toast('Copying was blocked: select the prompt below instead');
  }
  toast("Nom nom. Now paste it into your agent's chat.");
  feedBtn.textContent = 'Fed!';
  clearTimeout(fed);
  fed = setTimeout(() => {
    fed = 0;
    feedBtn.textContent = FEED;
  }, 2000);
});

for (const tab of document.querySelectorAll('[role=tab]')) {
  tab.addEventListener('click', () => {
    for (const t of document.querySelectorAll('[role=tab]')) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    }
  });
}

copyBtn.addEventListener('click', async () => {
  const style = css().startsWith('/*') ? '' : `\n<style>\n${css()}\n</style>`;
  const text = `${html()}${style}\n`;
  try {
    await navigator.clipboard.writeText(text);
    toast('Code copied');
  } catch {
    // Blocked: the code is in the page, to select by hand.
    document.querySelectorAll('.peek')[1].open = true;
    toast('Copying was blocked: select the code below instead');
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
