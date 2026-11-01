/**
 * The configurator, in steps: the real widget in `demo` mode on top, one card
 * under it for the part being changed, and Back / Preview / Next. Tapping a
 * part of the widget opens its colour or its words, in the step you are on.
 * The last step is the code.
 *
 * **Everything lives in this page's memory.** Nothing is saved, not even in
 * `localStorage`: the copied code is the only place a choice ends up.
 */

/** The npm version the copied code loads, filled in from the widget's
 *  package.json by `site/files.mjs`. Pinned, so a later release never changes
 *  somebody's app without them choosing to. */
const VERSION = '%VERSION%';

/**
 * The steps, in order. `screen` is the widget's `screen` attribute that puts
 * the part in view; `mark` finds that part in the widget's shadow root, to
 * draw a line around it.
 */
const STEPS = [
  { id: 'settings', name: 'Settings', screen: 'tiles' },
  { id: 'button', name: 'Feedback button', screen: 'button', mark: (r) => [r.querySelector('.fab')], floatingOnly: true },
  { id: 'tiles', name: 'Tiles', screen: 'tiles', mark: (r) => [...r.querySelectorAll('.tile')] },
  { id: 'board', name: 'Board', screen: 'board', mark: (r) => [r.querySelector('.bar'), r.querySelector('.list > li')] },
  { id: 'shots', name: 'Screenshots', screen: 'write', mark: (r) => [r.querySelector('.shot')], shotsOnly: true },
  { id: 'sent', name: 'Feedback sent!', screen: 'sent', mark: (r) => [r.querySelector('.sent')] },
  { id: 'code', name: 'Code', screen: 'tiles' },
];

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
};

/**
 * Per step, the families you can see on its screen: two to four up front,
 * the rest behind "More colours". A family can be in more than one step; it
 * is the same colour in each.
 */
const COLOURS = {
  button: { main: ['accent', '--pnb-on-fab'] },
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
  sent: { main: ['--pnb-sent', '--pnb-done'], more: ['--pnb-text', '--pnb-text-quiet'] },
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
  button: [['.fab', 'accent']],
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
    ['.sent__check', '--pnb-done'],
    ['.sent__title', { text: 'board.sent' }],
    ['.sent__note, .text-btn', '--pnb-text-quiet'],
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
const mark = document.getElementById('mark');
const backBtn = document.getElementById('back');
const nextBtn = document.getElementById('next');
const previewBtn = document.getElementById('preview');
const copyBtn = document.getElementById('copy');

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
let at = 'settings';
let previewing = false;

/** The widget in the box. */
let board = null;

/**
 * The steps there are for the current choices: no round button unless it is
 * one, and no screenshots without a bug or an idea to put them on.
 */
const route = () =>
  STEPS.filter(
    (s) =>
      (!s.floatingOnly || state.mode === 'floating') && (!s.shotsOnly || state.kinds.some((k) => k !== 'review')),
  );
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
 * page's bar over it on a narrow one (site.css picks).
 */
const INLINE_FRAME = `<div class="inline-frame" aria-hidden="true">
    <nav class="dk-menu"><b>Your app</b><span>Home</span><span>Settings</span><span class="dk-menu__pick">Feedback</span><span>About</span></nav>
    <b class="ph-back">‹&nbsp; Your app</b>
  </div>`;

/** A fresh widget in the box: for a new mode, and for a preview that starts as it would in an app. */
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
 * widget, over and over, on the same pretend app as the preview and at its
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

/** The pretend app, as in the preview, with what a way needs of it. */
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

function paintDevice() {
  const mode = at === 'settings' && !previewing ? state.mode : null;
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
  // live in its shadow root: read from one of the widgets in the box.
  const css = getComputedStyle(device.querySelector('please-no-bugs'));
  for (const [mine, theirs] of [['--ph-fab', '--pnb-fab'], ['--ph-on-fab', '--pnb-on-fab'], ['--ph-bg', '--pnb-bg']]) {
    device.style.setProperty(mine, css.getPropertyValue(theirs).trim());
  }
}

function update() {
  for (const input of form.querySelectorAll('[data-string]')) input.hidden = offKind(input.dataset.string);
  if (board) apply(board);
  paintDevice();
  // Kinds can take the screenshots step away, or bring it back.
  paintSteps();
  paintSwatches();
  writeCode();
}

// ---- Steps ---------------------------------------------------------------

function go(id) {
  if (!route().some((s) => s.id === id)) id = 'settings';
  const changed = id !== at;
  at = id;
  revealed = null;
  for (const el of form.querySelectorAll('[data-step]')) el.hidden = el.dataset.step !== at;
  paintSteps();
  if (previewing) endPreview();
  else if (board) apply(board);
  paintDevice();
  watch();
  // On a phone the card is under the widget: bring it into view.
  if (changed && window.matchMedia('(max-width: 639px)').matches) {
    form.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function paintSteps() {
  const steps = route();
  const i = steps.findIndex((s) => s.id === at);
  document.getElementById('count').textContent = `Step ${i + 1} of ${steps.length}`;
  document.getElementById('step-name').textContent = step().name;
  document.getElementById('bars').innerHTML = steps
    .map((s, n) => `<i class="${n < i ? 'done' : n === i ? 'now' : ''}"></i>`)
    .join('');
  backBtn.hidden = i === 0;
  const last = i === steps.length - 1;
  nextBtn.hidden = last;
  copyBtn.hidden = !last;
  if (!last) nextBtn.textContent = `Next: ${steps[i + 1].name}`;
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
 * down, before the widget's own buttons hear it. While previewing, the widget
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
    else if (what.text) form.querySelector(`[data-step="${at}"] [data-string="${what.text}"]`)?.focus();
  },
  true,
);

/** Open the colour picker of this step's `name`, behind "More colours" too. */
function pickColour(name) {
  const card = form.querySelector(`[data-step="${at}"]`);
  const input = card.querySelector(`[data-colour="${name}"]`);
  if (!input) return;
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

// ---- Preview -------------------------------------------------------------

previewBtn.addEventListener('click', () => (previewing ? endPreview() : startPreview()));

/** The widget as it is in an app: no part held, every tap its own. */
function startPreview() {
  previewing = true;
  previewBtn.textContent = 'Stop preview';
  screen.classList.add('screen--live');
  document.getElementById('hint').textContent = 'Try it: everything works, and nothing leaves this page.';
  mount();
}

function endPreview() {
  previewing = false;
  previewBtn.textContent = 'Preview';
  screen.classList.remove('screen--live');
  document.getElementById('hint').textContent = 'Tap a part of the widget to change it.';
  mount();
}

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
    if (!route().some((s) => s.id === at)) at = 'settings';
    mount();
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
  } else if (t.name === 'agent') {
    agent = t.value;
    return writeCode();
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
  box.className = 'field';
  box.innerHTML = `<span>Colours</span>
    <div class="dots">${main.map(dot).join('')}</div>
    <p class="colour-about" aria-live="polite">Tap a colour, or a part of the widget, to change it.</p>
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
  if (!fed) feedBtn.textContent = agent ? `Feed it to ${agent}` : 'Feed it to your AI';
}

// ---- The prompt ----------------------------------------------------------

/**
 * The last step's first route: one prompt for the developer's AI agent, with
 * the code above and all it needs to put it in any kind of app and to get a
 * server running. The agent picked changes the button, the greeting and the
 * toast, never the prompt. Like everything here it is remembered nowhere.
 */
let agent = 'Claude';
/** While the button says "Fed!". */
let fed = 0;
const feedBtn = document.getElementById('feed');

/** What the toast says once the prompt is copied, per agent. */
const FED = {
  Claude: 'Claude says nom nom. Paste it in the chat.',
  Cursor: 'Cursor is chewing on it. Paste it in the chat.',
  Codex: 'Codex is fed. Paste it in and watch it go.',
  '': "Copied. Paste it into your AI's chat.",
};

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
    `${agent ? `Hi ${agent}!` : 'Hi!'} Please add PleaseNoBugs to this app: a feedback board where its users report bugs, share ideas and write reviews, as one web component. I chose its look and settings on PleaseNoBugs' customize page; they are in the code below.`,
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
    document.querySelector('.feed__peek').open = true;
    return toast('Copying was blocked: select the prompt below instead');
  }
  toast(FED[agent]);
  feedBtn.textContent = 'Fed!';
  clearTimeout(fed);
  fed = setTimeout(() => {
    fed = 0;
    writeCode();
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
    toast('Copying was blocked: select the code above instead');
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
