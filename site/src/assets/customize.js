/**
 * The configurator, in steps, as one screen like the home page's demo: the
 * pretend app with the real widget in `demo` mode at its own place in it, and
 * a card inside the screen with the step, its choices and Back / Next
 * (customize.css places it: on the left from 980px, a panel along the bottom
 * that folds below that). Tapping a part of the widget opens its colour or
 * its words, in the step you are on. The steps follow the way a user goes,
 * as the demo does: the way in, the tiles, writing, sent, the board. The last
 * step is the widget working, and the code and the prompt to take along.
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
  // Before the steps, and not one of them: what is coming, while the widget
  // puts itself together beside it (`PLAYS.*.intro`). Every visit, as
  // nothing here is remembered; "Start building" goes on.
  {
    id: 'intro',
    name: 'Make it yours',
    intro: true,
    screen: '',
    hint: "Build your feedback widget right here, in your app's screen.",
  },
  { id: 'opens', name: 'How it opens', screen: 'tiles', hint: 'How people get to it in your app. The screen plays it.' },
  {
    id: 'tiles',
    name: 'Tiles',
    screen: 'tiles',
    mark: (r) => [...r.querySelectorAll('.tile')],
    hint: 'What people pick from when they open it. Tap a part of the widget, or a colour, to change it.',
  },
  {
    id: 'writing',
    name: 'Writing',
    screen: 'write',
    mark: (r) => [r.querySelector('.shot')],
    shotsOnly: true,
    hint: 'A bug or an idea can carry a screenshot. Pick who sees it: the widget shows what changes.',
  },
  {
    id: 'sent',
    name: 'Feedback sent!',
    screen: 'sent',
    mark: (r) => [r.querySelector('.sent')],
    hint: 'What people see right after they send. Tap a part to change it.',
  },
  {
    id: 'board',
    name: 'Board',
    screen: 'board',
    mark: (r) => [r.querySelector('.bar'), r.querySelector('.list > li')],
    hint: 'The posts people read and vote on, with your answers. Tap a part to change it.',
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
  accent: ['Accent', 'the round button, the send button, the toggle, a vote you gave'],
  '--pnb-on-fab': ['Button glyph', 'the sign on the round button'],
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
 * Per step, the families you can see on its screen: two to four up front,
 * the rest behind "More colours". A family can be in more than one step; it
 * is the same colour in each.
 */
const COLOURS = {
  opens: { main: ['accent', '--pnb-on-fab'] },
  tiles: {
    main: ['--pnb-bug', '--pnb-idea', '--pnb-review', '--pnb-bg'],
    more: ['--pnb-tile-ink', '--pnb-text', '--pnb-text-quiet'],
  },
  board: {
    main: ['--pnb-surface', '--pnb-text', '--pnb-bg', '--pnb-line', '--pnb-filter'],
    more: [
      '--pnb-text-quiet',
      '--pnb-surface-2',
      '--pnb-sunken',
      'accent',
      '--pnb-star',
      '--pnb-bug',
      '--pnb-idea',
      '--pnb-review',
      '--pnb-planned',
      '--pnb-done',
      '--pnb-declined',
    ],
  },
  // Only its own: the shared text colours and Done would change the whole widget.
  sent: { main: ['--pnb-sent', '--pnb-sent-check', '--pnb-sent-title', '--pnb-sent-note'] },
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
    ['.card__reply-who', { text: 'board.reply' }],
    ['.card__when, .card__who, .rating__n', '--pnb-text-quiet'],
    ['.card__text, .card__reply-text, .rating__avg', '--pnb-text'],
    ['.card__reply', '--pnb-bg'],
    ['.card, .rating, .chip-pick', '--pnb-surface'],
    ['*', '--pnb-bg'],
  ],
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

/** Chosen colours plus what is written on them. */
function withInk(colours) {
  const out = { ...colours };
  for (const [name, ink] of Object.entries(INK)) if (colours[name]) out[ink] = readableOn(colours[name]);
  return out;
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
 * The widget has other themes, but the configurator offers one: PleaseNoBugs'
 * own colours, each of which can be changed. The code still names it, so an
 * app gets these colours and not the widget's light default.
 */
const THEME = 'pleasenobugs';

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

/** The steps there are for the current choices: no screenshots without a bug or an idea to put them on. */
const route = () => STEPS.filter((s) => !s.shotsOnly || state.kinds.some((k) => k !== 'review'));
const step = () => STEPS.find((s) => s.id === at);

// ---- The widget ----------------------------------------------------------

/**
 * Put the settings on the widget: attributes, colours and texts. The device in
 * step 1 holds its widgets inline, on a screen of their own.
 */
function apply(el, mode = state.mode, held = previewing ? '' : step().screen) {
  const set = (name, value) => (value ? el.setAttribute(name, value) : el.removeAttribute(name));
  el.setAttribute('demo', '');
  el.setAttribute('mode', mode);
  set('theme', THEME);
  set('lang', 'en');
  set('accent', state.accent);
  set('kinds', state.kinds.length === 3 ? '' : state.kinds.join(','));
  set('screenshots', state.screenshots === 'board' ? '' : state.screenshots);
  set('screen', held);
  const colours = withInk(state.colours);
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
 * The intro's drawing, in the style of What is it?'s: a sketch of the widget
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
    <div class="sk-pick">${SKETCH_COLOURS.map((c) => `<i style="--c: ${c}"></i>`).join('')}</div>
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

function update() {
  for (const input of form.querySelectorAll('[data-string]')) input.hidden = offKind(input.dataset.string);
  paintOnly();
  if (board) apply(board);
  paintDevice();
  // Kinds can take the screenshots step away, or bring it back.
  paintSteps();
  paintSwatches();
  writeCode();
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
}

/** What is only there for one way of showing it: the round button's colours. */
function paintOnly() {
  for (const el of form.querySelectorAll('[data-only]')) el.hidden = el.dataset.only !== state.mode;
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
    if (what.colour) pickColour(what.colour);
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
  about(row);
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
function watch() {
  const idle = following < performance.now();
  following = performance.now() + 600;
  if (idle) requestAnimationFrame(follow);
}

function follow() {
  placeMark();
  if (performance.now() < following) requestAnimationFrame(follow);
}

function placeMark() {
  const root = board?.shadowRoot;
  const parts = !previewing && root && step().mark ? step().mark(root).filter(Boolean) : [];
  const rects = parts.map((el) => el.getBoundingClientRect()).filter((r) => r.width && r.height);
  if (!rects.length) {
    mark.hidden = true;
    return;
  }
  if (revealed !== at) {
    revealed = at;
    if (reveal(parts[0], rects)) return void placeMark();
  }
  const box = screen.getBoundingClientRect();
  const pad = 6;
  const left = Math.max(box.left, Math.min(...rects.map((r) => r.left)) - pad);
  const top = Math.max(box.top, Math.min(...rects.map((r) => r.top)) - pad);
  const right = Math.min(box.right, Math.max(...rects.map((r) => r.right)) + pad);
  const bottom = Math.min(box.bottom - 14, Math.max(...rects.map((r) => r.bottom)) + pad);
  mark.hidden = false;
  mark.style.left = `${left - box.left}px`;
  mark.style.top = `${top - box.top}px`;
  mark.style.width = `${right - left}px`;
  mark.style.height = `${Math.max(0, bottom - top)}px`;
  // A small part at the right edge, like the round button, keeps its tag inside the box.
  mark.classList.toggle('mark--right', right - left < 160 && right > box.left + box.width / 2);
  document.getElementById('mark-tag').textContent = step().name;
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
    mount();
    paintOnly();
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
  const reset = e.target.closest('[data-reset]');
  if (!reset) return;
  const name = reset.dataset.reset;
  if (name === 'accent') state.accent = '';
  else delete state.colours[name];
  update();
});

// ---- Colours -------------------------------------------------------------

/** A round colour with its name under it, as in the design. */
function dot(name) {
  const [label, what] = FAMILIES[name];
  return `<div class="dot" data-row="${name}" title="${label}: ${what}">
    <label class="swatch__dot"><input type="color" data-colour="${name}" aria-label="${label}: ${what}" /></label>
    <span class="dot__name">${label}</span>
    <button type="button" class="swatch__reset" data-reset="${name}" aria-label="${label} back to PleaseNoBugs' own" title="Back to PleaseNoBugs' own">×</button>
  </div>`;
}

/** The same colour as a row, for the longer list behind "More colours". */
function swatchRow(name) {
  const [label, what] = FAMILIES[name];
  return `<div class="swatch" data-row="${name}">
    <label class="swatch__dot"><input type="color" data-colour="${name}" aria-label="${label}: ${what}" /></label>
    <span class="swatch__name">${label}<small>${what}</small></span>
    <span class="swatch__hex"></span>
    <button type="button" class="swatch__reset" data-reset="${name}" aria-label="${label} back to PleaseNoBugs' own" title="Back to PleaseNoBugs' own">×</button>
  </div>`;
}

for (const box of form.querySelectorAll('[data-colours]')) {
  const { main, more } = COLOURS[box.dataset.colours];
  // In the first step the widget is a film, not a thing to tap.
  const film = box.dataset.colours === 'opens';
  box.className = 'field';
  box.innerHTML = `<span>${film ? 'The round button' : 'Colours'}</span>
    <div class="dots">${main.map(dot).join('')}</div>
    <p class="colour-about" aria-live="polite">${film ? 'Tap a colour to change it.' : 'Tap a colour, or a part of the widget, to change it.'}</p>
    ${more ? `<details class="more-colours"><summary>More colours</summary><div class="swatches">${more.map(swatchRow).join('')}</div></details>` : ''}`;
}

/** Say under the dots what the colour being changed paints. */
function about(row) {
  const [label, what] = FAMILIES[row.dataset.row];
  const line = row.closest('.field').querySelector('.colour-about');
  line.innerHTML = `<b>${label}</b>: ${what}.`;
}

form.addEventListener('focusin', (e) => {
  const row = e.target.closest('.dot');
  if (row) about(row);
});
form.addEventListener('pointerover', (e) => {
  const row = e.target.closest('.dot');
  if (row) about(row);
});

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
 * Show each colour as the widget has it now. A value is read from the widget
 * itself with the override lifted for a moment, so "the theme's" is always
 * what the theme really says, gradients included.
 */
function paintSwatches() {
  if (!board?.shadowRoot) return void requestAnimationFrame(paintSwatches);
  for (const row of form.querySelectorAll('[data-row]')) {
    const name = row.dataset.row;
    row.hidden = offKind(name);
    const own = name === 'accent' ? state.accent : state.colours[name];
    const value = own || themeValue(name === 'accent' ? '--pnb-accent' : name);
    row.querySelector('.swatch__dot').style.background = value || 'transparent';
    row.querySelector('input').value = toHex(value) ?? '#000000';
    const hex = row.querySelector('.swatch__hex');
    if (hex) hex.textContent = own ? own : /gradient/.test(value) ? 'gradient' : (toHex(value) ?? value);
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
    ['theme', THEME],
    state.accent && ['accent', state.accent],
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
  // A kind left off takes its colours out of the code, kept here for if it comes back.
  const rows = Object.entries(withInk(state.colours))
    .filter(([k]) => !offKind(k)).map(([k, v]) => `  ${k}: ${v};`);
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
    'The widget talks to a PleaseNoBugs server that I run myself, so nobody else holds the feedback. First ask me whether I have one. If I do, ask me for its project id and its address: it prints both in its log every time it starts. If not, help me pick one of these and walk me through it:',
    '- Railway, no command line, about $1 a month: I open https://railway.com/deploy/PdvdtB, sign in and fill in three fields. Tell me what goes in them: PNB_PROJECT_NAME (what users call this app), PNB_PROJECT_ORIGINS (where it runs, comma-separated, the local dev address too, like https://my.app,http://localhost:5173) and PNB_PROJECT_OWNER (my NQ... wallet address, which answers posts). Then I paste you what Deploy Logs says.',
    `- This app's own Node backend (Node 22.13 or newer): npx @pleasenobugs/server create-project --name "..." --origin https://... --owner "NQ...", then npx @pleasenobugs/server. Or mount it in Express: ${REPO}/tree/main/packages/server`,
    '- Docker on a machine I rent: docker-compose.yml from the repo, a .env with PNB_DOMAIN and the same three fields, then docker compose up -d; the project id is in docker compose logs pleasenobugs.',
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
    '- Inside Nimiq Pay, Pay draws its own bar over the page and the widget cannot see it. If this app already measures that bar, pass it on: please-no-bugs { --pnb-inset-top: ...; --pnb-inset-bottom: ...; }',
    '- Keep the version pinned.',
    '',
    '3. Check it',
    'Start the app, open the widget and make sure the board loads. Posting or voting asks the wallet to sign; inside Nimiq Pay that happens by itself. To answer posts, I open it with the owner wallet and tap "Sign in with your wallet" at the foot of the board.',
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
paintOnly();
paintSteps();
paintSwatches();
writeCode();
measureDeck();
