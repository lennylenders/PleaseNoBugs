/**
 * The configurator, in steps, as one screen like the home page's demo: the
 * pretend app with the real widget in `demo` mode at its own place in it, and
 * a card inside the screen with the step, its choices and Back / Next
 * (customize.css places it: on the left from 980px, a panel along the bottom
 * that folds below that). The widget starts grey, as in the intro's sketch,
 * and is coloured in part by part: a line goes round the part, a row of
 * colours that suit it opens beside it, and a pick paints it and moves the
 * line on to the next. A step goes on once its parts all have a colour. The
 * steps follow the way a user goes, as the demo does: the way in, the
 * button, the tiles, writing, sent, the board. The last step is the widget
 * working, and the code and the prompt to take along.
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
 * `screen` attribute that puts the part in view; `mark` finds that part in
 * the widget's shadow root, to draw a line around it; `name` is the card's
 * heading and `hint` the line under it, saying what to do. The round button's
 * colours are in the first step, with the way that has one. The last step is
 * `live`: the widget is itself there, every tap its own, to check every
 * colour and word on every screen before taking the code.
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
  { id: 'opens', name: 'How it opens', screen: 'tiles', hint: 'How people get to it in your app. The screen plays it.' },
  // Only for the round button (`floatingOnly`): inline and overlay have none.
  {
    id: 'button',
    name: 'The button',
    screen: 'button',
    floatingOnly: true,
    mark: (r) => [r.querySelector('.fab')],
    hint: 'The round button in the corner of every screen. Give it a colour, then its icon.',
  },
  {
    id: 'tiles',
    name: 'Tiles',
    screen: 'tiles',
    mark: (r) => [...r.querySelectorAll('.tile')],
    hint: 'What people pick from when they open it. Colour each tile, then the background.',
  },
  {
    id: 'writing',
    name: 'Writing',
    screen: 'write',
    mark: (r) => [r.querySelector('.send .btn'), r.querySelector('.shot')],
    hint: 'Where people write. Colour the button that sends it.',
  },
  {
    id: 'sent',
    name: 'Feedback sent!',
    screen: 'sent',
    mark: (r) => [r.querySelector('.sent')],
    hint: 'What people see right after they send. Colour each part.',
  },
  {
    id: 'board',
    name: 'Board',
    screen: 'board',
    mark: (r) => [r.querySelector('.bar'), r.querySelector('.list > li')],
    hint: 'The posts people read and vote on, with your answers. Colour each part.',
  },
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
  '--pnb-bug': ['Bug', 'its tile and its badge'],
  '--pnb-idea': ['Idea', 'its tile and its badge'],
  '--pnb-review': ['Review', 'its tile and its badge'],
  '--pnb-tile-ink': ['On tiles', 'the words and icons on the tiles'],
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
 * Per step, the parts to colour in (`main`), in the order the line goes
 * round them, and behind "More colours" the small ones that are worked out
 * from them (`DERIVED`) but can still be set by hand. A family is the same
 * colour in every step it is in.
 */
const COLOURS = {
  button: { main: ['--pnb-fab', '--pnb-on-fab'] },
  tiles: {
    main: ['--pnb-bug', '--pnb-idea', '--pnb-review', '--pnb-bg'],
    more: ['--pnb-tile-ink'],
  },
  writing: { main: ['accent'] },
  // Only its own: the shared text colours and Done would change the whole widget.
  sent: { main: ['--pnb-sent', '--pnb-sent-check', '--pnb-sent-title', '--pnb-sent-note'] },
  board: {
    // The filter only shows with the filters open: it follows the text, as in the widget.
    main: ['--pnb-surface', '--pnb-text', '--pnb-line'],
    more: ['--pnb-filter', '--pnb-text-quiet', '--pnb-surface-2', '--pnb-sunken', '--pnb-star', '--pnb-planned', '--pnb-done', '--pnb-declined'],
  },
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
  '--pnb-bg': 'ground',
  accent: 'bright',
  '--pnb-sent': 'sent',
  '--pnb-sent-check': 'bright',
  '--pnb-sent-title': 'ink',
  '--pnb-sent-note': 'ink',
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
  '--pnb-tile-ink': 'rgba(255, 255, 255, 0.55)',
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
 * The small colours, worked out from the picked ones: a colour, `null` for
 * the theme's own, or nothing while what it comes from is still grey.
 */
const DERIVED = {
  '--pnb-filter': (c) => c['--pnb-text'],
  '--pnb-text-quiet': (c) => c['--pnb-text'] && `color-mix(in srgb, ${c['--pnb-text']} 75%, transparent)`,
  '--pnb-surface-2': (c) => c['--pnb-surface'] && `color-mix(in srgb, ${c['--pnb-surface']}, ${c['--pnb-bg'] ?? GREY['--pnb-bg']} 45%)`,
  '--pnb-sunken': (c) => c['--pnb-bg'] && `color-mix(in srgb, ${c['--pnb-bg']}, #000 38%)`,
  '--pnb-star': (c) => c['--pnb-review'],
  // Words on the tiles: white, unless every tile picked is light.
  '--pnb-tile-ink': (c) => {
    const tiles = ['bug', 'idea', 'review'].filter((k) => state.kinds.includes(k)).map((k) => c[`--pnb-${k}`]).filter(Boolean);
    if (!tiles.length) return undefined;
    return tiles.every((t) => readableOn(t) !== '#ffffff') ? '#111118' : '#ffffff';
  },
  // The statuses keep the theme's own, once the board has colours of its own.
  '--pnb-planned': (c) => (c['--pnb-surface'] ? null : undefined),
  '--pnb-done': (c) => (c['--pnb-surface'] ? null : undefined),
  '--pnb-declined': (c) => (c['--pnb-surface'] ? null : undefined),
};

/** Where a part is in the widget, to put the line and the colours round it. */
const PART_AT = {
  '--pnb-fab': '.fab',
  '--pnb-on-fab': '.fab',
  '--pnb-bug': '.tile--bug',
  '--pnb-idea': '.tile--idea',
  '--pnb-review': '.tile--review',
  '--pnb-bg': '.app',
  accent: '.send .btn',
  '--pnb-sent': '.sent',
  '--pnb-sent-check': '.sent__check',
  '--pnb-sent-title': '.sent__title',
  '--pnb-sent-note': '.sent__note',
  '--pnb-surface': '.list > li .card, .card',
  '--pnb-text': '.card__text',
  '--pnb-line': '.search',
};

/**
 * What a tap in the widget opens, per screen: the family that paints the
 * part, or the words in it. The first part the tap is inside wins, so the
 * small ones come first; `*` is the background around them. Only the step
 * you are on listens, and a tap never moves you to another step. The dim
 * page around the panel is the app's, not the widget's: it opens nothing.
 */
const OUTSIDE = ['.backdrop', {}];
const PARTS = {
  button: [
    ['.fab svg', '--pnb-on-fab'],
    ['.fab', '--pnb-fab'],
  ],
  tiles: [
    OUTSIDE,
    ['.tile--bug', '--pnb-bug'],
    ['.tile--idea', '--pnb-idea'],
    ['.tile--review', '--pnb-review'],
    ['.choose__title', { text: 'board.chooseTitle' }],
    ['.text-btn', '--pnb-text-quiet'],
    ['.icon-btn', '--pnb-text'],
    ['*', '--pnb-bg'],
  ],
  board: [
    OUTSIDE,
    ['.bar__title', { text: 'board.title' }],
    ['.icon-btn', '--pnb-text'],
    ['.badge__dot--bug', '--pnb-bug'],
    ['.badge__dot--idea', '--pnb-idea'],
    ['.badge__dot--review', '--pnb-review'],
    ['.badge__dot--planned', '--pnb-planned'],
    ['.badge__dot--done', '--pnb-done'],
    ['.badge__dot--declined', '--pnb-declined'],
    ['.badge, .vote', '--pnb-surface-2'],
    ['.stars__fill', '--pnb-star'],
    ['.stars__one', '--pnb-line'],
    ['.stars', '--pnb-star'],
    ['.order__tab[aria-selected="true"]', '--pnb-surface'],
    ['.order__pill', '--pnb-sunken'],
    ['.chip-pick[aria-pressed="true"], .chip-pick[aria-checked="true"]', '--pnb-filter'],
    ['.search, .filter-btn', '--pnb-line'],
    ['.card__reply-who', { text: 'board.reply' }],
    ['.card__when, .card__who, .rating__n', '--pnb-text-quiet'],
    ['.card__text, .card__reply-text, .rating__avg', '--pnb-text'],
    ['.card__reply', '--pnb-bg'],
    ['.card, .rating, .chip-pick', '--pnb-surface'],
    ['*', '--pnb-bg'],
  ],
  write: [OUTSIDE, ['.send .btn', 'accent']],
  sent: [
    OUTSIDE,
    ['.sent__check', '--pnb-sent-check'],
    ['.sent__title', { text: 'board.sent' }],
    ['.sent__note, .text-btn', '--pnb-sent-note'],
    ['*', '--pnb-sent'],
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

/** Whether a part has a colour of its own yet. */
const picked = (name) => !!(name === 'accent' ? state.accent : state.colours[name]);

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

/**
 * The texts worth changing, per step, with the widget's own English words as
 * placeholders. A copy of `packages/widget/src/i18n.ts` for these keys only:
 * if a word changes there, change it here.
 */
const STRINGS = {
  board: [
    ['Title', [['board.title', 'Feedback']]],
    ['Above your answers', [['board.reply', '<YOUR APP> says']]],
  ],
  tiles: [
    ['Question above the tiles', [['board.chooseTitle', 'What do you want to share?']]],
    ['Words on the tiles', [['board.tileBug', 'Report a bug'], ['board.tileIdea', 'Share an idea'], ['board.tileReview', 'Write a review']]],
  ],
  sent: [['Title', [['board.sent', 'Feedback sent!']]]],
};

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

/** The parts a step has to colour in, in order: a kind left off has none. */
const partsOf = (id = at) => (COLOURS[id]?.main ?? []).filter((name) => !offKind(name));
/** The ones still grey. */
const greyIn = (id = at) => partsOf(id).filter((name) => !picked(name));

/**
 * The part being coloured in, per step: one tapped, or else the first still
 * grey. Null once the step is all coloured: then the line goes round the
 * step's whole part again, and a tap on a part picks it.
 */
const chosenPart = {};
function currentPart() {
  const tapped = chosenPart[at];
  if (tapped && partsOf().includes(tapped)) return tapped;
  return greyIn()[0] ?? null;
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
  revealed = null;
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
  style.textContent =
    `@media (min-width: 640px) { .overlay, .overlay .app { max-height: ${h}px; } }` +
    // While choosing, the widget holds still: a part is picked, not scrolled past.
    (previewing ? '' : ' .scroll { overflow: hidden !important; }');
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

function paintDevice() {
  const mode = previewing ? null : at === 'opens' ? state.mode : at === 'intro' ? 'intro' : null;
  const kind = wide.matches ? 'desk' : 'phone';
  screen.classList.toggle('screen--device', !!mode);
  // The app's own background behind every way, inline too.
  screen.classList.toggle('screen--inline', state.mode === 'inline' && !mode);
  if (device && device.dataset.key !== `${kind} ${mode}`) {
    device.remove();
    device = null;
  }
  if (!mode) return;
  if (!device) {
    device = document.createElement('div');
    device.className = `play play--${kind} play--${mode}`;
    device.dataset.key = `${kind} ${mode}`;
    device.setAttribute('aria-hidden', 'true');
    device.innerHTML = PLAYS[kind][mode];
    screen.append(device);
    if (mode === 'intro') playSketch(device);
  }
  for (const w of device.querySelectorAll('please-no-bugs')) {
    apply(w, 'inline', w.dataset.screen);
    // Held still, and without the bar over the tiles, which here would only
    // be an empty strip: the real panel has its X there.
    if (w.shadowRoot && !w.shadowRoot.querySelector('style[data-site]')) {
      const style = document.createElement('style');
      style.dataset.site = '';
      style.textContent = '.scroll { overflow: hidden !important; } .bar { visibility: hidden; }';
      w.shadowRoot.append(style);
    }
  }
  // The button and the panel behind it in the widget's own colours, which
  // live in its shadow root: read from one of the widgets in the box. The
  // intro's drawing has none: it is a sketch.
  const one = device.querySelector('please-no-bugs');
  if (!one) return;
  const css = getComputedStyle(one);
  for (const [mine, theirs] of [['--ph-fab', '--pnb-fab'], ['--ph-on-fab', '--pnb-on-fab'], ['--ph-bg', '--pnb-bg']]) {
    device.style.setProperty(mine, css.getPropertyValue(theirs).trim());
  }
}

// The header's style switch: the widgets and the code take the other theme.
document.addEventListener('pnb:style', () => update());

function update() {
  for (const input of form.querySelectorAll('[data-string]')) input.hidden = offKind(input.dataset.string);
  // Screenshots go on bugs and ideas only.
  form.querySelector('[data-shots]').hidden = !state.kinds.some((k) => k !== 'review');
  if (board) apply(board);
  paintDevice();
  // A kind ticked on brings a grey tile, and holds Next until it has a colour.
  paintSteps();
  paintSwatches();
  writeCode();
  // The line and the colours move at once, then follow the widget a moment.
  placeMark();
  watch();
}

// ---- Steps ---------------------------------------------------------------

function go(id) {
  if (!route().some((s) => s.id === id)) id = 'opens';
  const forward = route().findIndex((s) => s.id === id) > route().findIndex((s) => s.id === at);
  at = id;
  revealed = null;
  for (const el of form.querySelectorAll('[data-step]')) el.hidden = el.dataset.step !== at;
  paintSteps();
  // Each step starts at its top.
  deckBody.scrollTop = 0;
  // Into the last step and out of it, a fresh widget, as it starts in an app.
  const live = !!step().live;
  if (live !== previewing) {
    previewing = live;
    screen.classList.toggle('screen--live', live);
    mount();
    if (live && forward) cheer("You're ready!");
  } else if (board) apply(board);
  paintDevice();
  watch();
}

function paintSteps() {
  // The intro is before the steps, not one of them.
  const steps = route().filter((s) => !s.intro);
  const i = steps.findIndex((s) => s.id === at);
  deck.classList.toggle('deck--intro', !!step().intro);
  document.getElementById('count').textContent = `Step ${i + 1} of ${steps.length}`;
  document.getElementById('short').textContent = `· ${step().name}`;
  document.getElementById('step-name').textContent = step().name;
  document.getElementById('bars').innerHTML = steps
    .map((s, n) => `<i class="${n < i ? 'done' : n === i ? 'now' : ''}"></i>`)
    .join('');
  document.getElementById('hint').textContent = step().live
    ? READY_HINT[beside.matches ? 'side' : 'under']
    : step().hint;
  deck.classList.toggle('deck--ready', !!step().live);
  backBtn.hidden = i <= 0;
  const last = i === steps.length - 1;
  nextBtn.hidden = last || i < 0;
  if (!last) nextBtn.textContent = `Next: ${steps[i + 1].name}`;
  // On once every part of the step has a colour: never a half-grey widget.
  const left = greyIn().length;
  nextBtn.disabled = left > 0;
  nextBtn.title = left ? `Colour ${left === 1 ? 'one more part' : `${left} more parts`} first` : '';
  paintProgress();
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
 * Along the bottom, the card takes its height off the app, so the widget is
 * always whole above it (`--deck-h`, customize.css); beside, it takes none.
 * The widget's panel and the line around its part follow.
 */
function measureDeck() {
  foldBtn.disabled = beside.matches;
  screen.style.setProperty('--deck-h', beside.matches ? '0px' : `${deck.offsetHeight}px`);
  fitPanel();
  watch();
}
new ResizeObserver(measureDeck).observe(deck);
beside.addEventListener('change', () => {
  fold(false);
  measureDeck();
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

backBtn.addEventListener('click', () => {
  const steps = route();
  go(steps[steps.findIndex((s) => s.id === at) - 1].id);
});

nextBtn.addEventListener('click', () => {
  const steps = route();
  go(steps[steps.findIndex((s) => s.id === at) + 1].id);
});

/**
 * A tap in the widget picks a part instead of using it: caught on its way
 * down, before the widget's own buttons hear it. In the test step the widget
 * has its taps to itself.
 */
screen.addEventListener(
  'click',
  (e) => {
    if (previewing || !board) return;
    const path = e.composedPath();
    if (!path.includes(board)) return;
    e.preventDefault();
    e.stopPropagation();
    const inside = path.filter((n) => n instanceof Element);
    if (!COLOURS[at]) return;
    const hit = (PARTS[step().screen] ?? []).find(([sel]) => sel === '*' || inside.some((n) => n.matches(sel)));
    if (!hit) return;
    const what = typeof hit[1] === 'string' ? { colour: hit[1] } : hit[1];
    // A part of this step: the line and the colours go to it.
    if (what.colour && partsOf().includes(what.colour)) choosePart(what.colour);
    else if (what.colour) pickColour(what.colour);
    else if (what.text) {
      if (folded) fold(false);
      form.querySelector(`[data-step="${at}"] [data-string="${what.text}"]`)?.focus();
    }
  },
  true,
);

/** Open the colour picker of this step's `name`, behind "More colours" too. */
function pickColour(name) {
  const card = form.querySelector(`[data-step="${at}"]`);
  const input = card.querySelector(`[data-colour="${name}"]`);
  if (!input) return;
  // A folded panel opens first: its picker is in it.
  if (folded) fold(false);
  const more = input.closest('details');
  if (more) more.open = true;
  const row = input.closest('[data-row]');
  row.classList.add('picked');
  setTimeout(() => row.classList.remove('picked'), 1200);
  try {
    input.showPicker();
  } catch {
    input.click();
  }
}

// ---- The line around the part --------------------------------------------

/**
 * Draw the line around this step's part. The widget moves while it opens and
 * while it loads its posts, so for a moment after anything changes the line
 * follows it every frame.
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

function placeMark() {
  const root = board?.shadowRoot;
  // The part being coloured in, or else the step's whole part.
  const part = !previewing && root ? currentPart() : null;
  const own = part ? root.querySelector(PART_AT[part]) : null;
  const parts = own ? [own] : !previewing && root && step().mark ? step().mark(root).filter(Boolean) : [];
  const rects = parts.map((el) => el.getBoundingClientRect()).filter((r) => r.width && r.height);
  if (!rects.length) {
    mark.hidden = true;
    pick.hidden = true;
    return;
  }
  if (revealed !== at) {
    revealed = at;
    if (reveal(parts[0], rects)) return void placeMark();
  }
  const box = screen.getBoundingClientRect();
  // Along the bottom the card covers the foot of the box: the line and the
  // colours stay above it.
  const floor = beside.matches ? box.bottom : Math.min(box.bottom, deck.getBoundingClientRect().top + 8);
  const pad = 6;
  const left = Math.max(box.left, Math.min(...rects.map((r) => r.left)) - pad);
  const top = Math.max(box.top, Math.min(...rects.map((r) => r.top)) - pad);
  const right = Math.min(box.right, Math.max(...rects.map((r) => r.right)) + pad);
  const bottom = Math.min(floor - 14, Math.max(...rects.map((r) => r.bottom)) + pad);
  mark.hidden = false;
  mark.style.left = `${left - box.left}px`;
  mark.style.top = `${top - box.top}px`;
  mark.style.width = `${right - left}px`;
  mark.style.height = `${Math.max(0, bottom - top)}px`;
  // A small part at the right edge, like the round button, keeps its tag inside the box.
  mark.classList.toggle('mark--right', right - left < 160 && right > box.left + box.width / 2);
  // A part as big as the box, like the background, keeps its tag inside it.
  mark.classList.toggle('mark--in', bottom > floor - 30);
  mark.classList.toggle('mark--small', right - left < 90 && bottom - top < 90);
  // A part that cannot be found in the widget still gets its colours, by the step's part.
  document.getElementById('mark-tag').textContent = part ? FAMILIES[part][0] : step().name;
  placePick(part, { left, top, right, bottom }, box, floor);
}

// ---- The colours beside the part -----------------------------------------

const pick = document.getElementById('pick');

/** Fill the row for `part`: its six colours, then any colour at all. */
function fillPick(part) {
  if (pick.dataset.part === part) return;
  pick.dataset.part = part;
  const [label] = FAMILIES[part];
  pick.setAttribute('aria-label', `Colours for ${label}`);
  pick.innerHTML = `${PALETTES[PALETTE_OF[part]]
    .map((c) => `<button type="button" class="pick__dot" data-pick="${c}" style="--c: ${c}" aria-label="${c}"></button>`)
    .join('')}<label class="pick__own" title="Your own colour"><input type="color" data-own aria-label="Your own colour for ${label}" /></label>`;
}

/**
 * The row under the part, or over it where there is no room under it, or
 * inside its foot when it fills the box (the background). Never off the box.
 */
function placePick(part, r, box, floor) {
  if (!part) {
    pick.hidden = true;
    pick.dataset.part = '';
    return;
  }
  fillPick(part);
  const value = (part === 'accent' ? state.accent : state.colours[part]) || '';
  for (const b of pick.querySelectorAll('[data-pick]')) b.classList.toggle('is-on', b.dataset.pick === value);
  pick.querySelector('[data-own]').value = toHex(value) ?? '#888888';
  pick.hidden = false;
  const pw = pick.offsetWidth;
  const ph = pick.offsetHeight;
  const room = floor - 10;
  let top = r.bottom + 18;
  if (top + ph > room) top = r.top - ph - 12;
  // No room above or below: inside the part's foot, clear of its name.
  if (top < box.top + 8) top = Math.min(room, r.bottom) - ph - 34;
  const left = Math.min(box.right - pw - 8, Math.max(box.left + 8, (r.left + r.right) / 2 - pw / 2));
  pick.style.left = `${left - box.left}px`;
  pick.style.top = `${top - box.top}px`;
}

/** Give `part` a colour, or take it back to grey with ''. */
function setColour(part, value) {
  if (part === 'accent') state.accent = value;
  else if (value) state.colours[part] = value;
  else delete state.colours[part];
  update();
}

/** On to the next part still grey, after this one; none left, the step is done. */
function nextPart(after) {
  const parts = partsOf();
  const from = parts.indexOf(after);
  const next = [...parts.slice(from + 1), ...parts.slice(0, from + 1)].find((n) => !picked(n));
  chosenPart[at] = next ?? null;
  update();
}

/** Put the line and the colours on `part`, from a tap on it in the widget or its dot in the card. */
function choosePart(part) {
  chosenPart[at] = part;
  paintProgress();
  placeMark();
  watch();
}

pick.addEventListener('click', (e) => {
  const dot = e.target.closest('[data-pick]');
  const part = pick.dataset.part;
  if (!dot || !part) return;
  // The line stays on it while it takes the colour.
  chosenPart[at] = part;
  setColour(part, dot.dataset.pick);
  // A moment to see it land, then on.
  dot.classList.add('is-on');
  setTimeout(() => nextPart(part), 260);
});
// Your own colour: the part follows while you choose, and the line moves on once it is closed.
pick.addEventListener('input', (e) => {
  if (!e.target.matches('[data-own]') || !pick.dataset.part) return;
  chosenPart[at] = pick.dataset.part;
  setColour(pick.dataset.part, e.target.value);
});
pick.addEventListener('change', (e) => {
  if (e.target.matches('[data-own]') && pick.dataset.part) nextPart(pick.dataset.part);
});

/**
 * The card's own line under its dots: how far the step is, and which part
 * the colours are for now.
 */
function paintProgress() {
  const box = form.querySelector(`[data-step="${at}"] [data-colours]`);
  if (!box) return;
  const parts = partsOf();
  const done = parts.filter(picked).length;
  const now = currentPart();
  for (const d of box.querySelectorAll('.dot')) d.classList.toggle('is-now', d.dataset.row === now);
  box.querySelector('.colour-about').innerHTML = now
    ? `<b>${done} of ${parts.length} coloured.</b> Now: ${FAMILIES[now][0]}. Pick a colour beside it.`
    : `<b>All ${parts.length} coloured.</b> Tap a part to change it.`;
}

/**
 * Scroll the widget once per step so the whole part is in view, like the send
 * button at the foot of a long writing screen. Once, so a visitor scrolling
 * the widget themselves is never pulled back. Says whether it moved.
 */
let revealed = null;
function reveal(part, rects) {
  const scroller = part.closest('.scroll');
  if (!scroller) return false;
  const view = scroller.getBoundingClientRect();
  const top = Math.min(...rects.map((r) => r.top));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  // Down until the bottom shows, but never so far that the top goes out.
  const by = Math.min(bottom + 12 - view.bottom, top - 12 - view.top);
  if (by <= 0) return false;
  scroller.scrollTop += by;
  return true;
}

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

// ---- Settings ------------------------------------------------------------

form.addEventListener('input', (e) => {
  const t = e.target;
  if (t.name === 'screenshots') state.screenshots = t.value;
  else if (t.name === 'kinds') {
    const on = [...form.querySelectorAll('input[name=kinds]:checked')].map((i) => i.value);
    // At least one kind: a board nobody can write on is no board.
    if (!on.length) {
      t.checked = true;
      return toast('Keep at least one kind');
    }
    state.kinds = on;
  } else if (t.name === 'mode') {
    state.mode = t.value;
    // Without a round button its step is gone: never stay on it.
    if (!route().some((s) => s.id === at)) go('opens');
    else mount();
    paintSteps();
    paintSwatches();
    writeCode();
    return;
  } else if (t.dataset.colour) {
    const name = t.dataset.colour;
    if (name === 'accent') state.accent = t.value;
    else state.colours[name] = t.value;
  } else if (t.dataset.string) {
    if (t.value.trim()) state.strings[t.dataset.string] = t.value;
    else delete state.strings[t.dataset.string];
  } else return;
  update();
});

form.addEventListener('click', (e) => {
  // A part's dot in the card: the line and the colours go to it.
  const part = e.target.closest('[data-part]');
  if (part) return choosePart(part.dataset.part);
  const reset = e.target.closest('[data-reset]');
  if (!reset) return;
  setColour(reset.dataset.reset, '');
});

// ---- Colours -------------------------------------------------------------

/** A part to colour in, round, with its name under it: grey until it has a colour. */
function dot(name) {
  const [label, what] = FAMILIES[name];
  return `<button type="button" class="dot" data-row="${name}" data-part="${name}" title="${label}: ${what}" aria-label="${label}: ${what}">
    <span class="swatch__dot"></span>
    <span class="dot__name">${label}</span>
  </button>`;
}

/** A small colour, worked out by itself, as a row behind "More colours" to set by hand. */
function swatchRow(name) {
  const [label, what] = FAMILIES[name];
  return `<div class="swatch" data-row="${name}">
    <label class="swatch__dot"><input type="color" data-colour="${name}" aria-label="${label}: ${what}" /></label>
    <span class="swatch__name">${label}<small>${what}</small></span>
    <span class="swatch__hex"></span>
    <button type="button" class="swatch__reset" data-reset="${name}" aria-label="${label} back to worked out" title="Back to worked out">×</button>
  </div>`;
}

for (const box of form.querySelectorAll('[data-colours]')) {
  const { main, more } = COLOURS[box.dataset.colours];
  box.className = 'field';
  box.innerHTML = `<span>Colour it in</span>
    <div class="dots">${main.map(dot).join('')}</div>
    <p class="colour-about" aria-live="polite"></p>
    ${more ? `<details class="more-colours"><summary>More colours</summary><p class="more-colours__about">Worked out from yours. Change one if you like.</p><div class="swatches">${more.map(swatchRow).join('')}</div></details>` : ''}`;
}

/** The colours and words that belong to one kind: gone with it when it is unticked. */
const KIND_OF = {
  '--pnb-bug': 'bug',
  '--pnb-idea': 'idea',
  '--pnb-review': 'review',
  '--pnb-star': 'review',
  'board.tileBug': 'bug',
  'board.tileIdea': 'idea',
  'board.tileReview': 'review',
};

/** Whether a colour or a word is for a kind that is left off. */
const offKind = (name) => !!KIND_OF[name] && !state.kinds.includes(KIND_OF[name]);

/**
 * Show each colour as the widget has it now: picked, worked out, or grey. One
 * that keeps the theme's own is read from the widget itself with the
 * override lifted for a moment, so it is what the theme really says.
 */
function paintSwatches() {
  if (!board?.shadowRoot) return void requestAnimationFrame(paintSwatches);
  const now = paint();
  for (const row of form.querySelectorAll('[data-row]')) {
    const name = row.dataset.row;
    row.hidden = offKind(name);
    const own = name === 'accent' ? state.accent : state.colours[name];
    const value = name === 'accent' ? accent() : (now[name] ?? themeValue(name));
    row.querySelector('.swatch__dot').style.background = value || 'transparent';
    const input = row.querySelector('input');
    if (input) input.value = toHex(value) ?? '#000000';
    const hex = row.querySelector('.swatch__hex');
    if (hex) hex.textContent = own ? own : /gradient|mix/.test(value) ? 'worked out' : (toHex(value) ?? value);
    row.classList.toggle('swatch--set', !!own);
  }
}

function themeValue(prop) {
  const mine = board.style.getPropertyValue(prop);
  if (mine) board.style.removeProperty(prop);
  const value = getComputedStyle(board).getPropertyValue(prop).trim();
  if (mine) board.style.setProperty(prop, mine);
  return value;
}

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

// ---- Texts ---------------------------------------------------------------

for (const box of form.querySelectorAll('[data-strings]')) {
  box.innerHTML = STRINGS[box.dataset.strings]
    .map(
      ([label, keys]) =>
        `<div class="field"><span>${label}</span>${keys
          .map(([key, words]) => `<input class="input" data-string="${key}" maxlength="80" placeholder="${words}" aria-label="${label}: ${words}" />`)
          .join('')}</div>`,
    )
    .join('');
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
  // Every colour picked or worked out. A kind left off takes its colours out
  // of the code, kept here for if it comes back; so does the round button
  // when it is shown another way. A grey one never gets this far: Next waits
  // for it.
  const rows = Object.entries(paint())
    .filter(([k, v]) => !offKind(k) && (state.mode === 'floating' || !FAB.includes(k)) && v !== GREY[k])
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
paintSwatches();
writeCode();
measureDeck();
