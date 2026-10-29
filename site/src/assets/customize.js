/**
 * The configurator, in steps: the real widget in `demo` mode on top, one card
 * under it for the part being changed, and Back / Preview / Next. Tapping a
 * part of the widget jumps to its step. The last step is the code.
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
  { id: 'look', name: 'Look', screen: 'tiles', mark: (r) => [r.querySelector('.overlay') ?? r.querySelector('.app')] },
  { id: 'button', name: 'Round button', screen: 'button', mark: (r) => [r.querySelector('.fab')], floatingOnly: true },
  { id: 'board', name: 'Board', screen: 'board', mark: (r) => [r.querySelector('.bar'), r.querySelector('.list > li')] },
  { id: 'tiles', name: 'Tiles', screen: 'tiles', mark: (r) => [...r.querySelectorAll('.tile')] },
  { id: 'write', name: 'Write and send', screen: 'write', mark: (r) => [r.querySelector('.shot'), r.querySelector('.switch-row'), r.querySelector('.send')] },
  { id: 'sent', name: 'Feedback sent!', screen: 'sent', mark: (r) => [r.querySelector('.sent')] },
  { id: 'code', name: 'Code', screen: 'tiles' },
];

/**
 * Which step a tap in the widget leads to. The first part the tap is inside
 * wins; anything else counts for the screen it is on, and the tiles screen
 * itself (its header, around the tiles) for the look.
 */
const TAPS = [
  ['.fab', 'button'],
  ['.tile', 'tiles'],
  ['.choose__board', 'board'],
];
const SCREEN_STEP = { tiles: 'look', button: 'look', board: 'board', write: 'write', sent: 'sent' };

/** Two or three colours per step, and the rest of that part's behind "More colours". */
const COLOURS = {
  look: { main: [['accent', 'Accent']] },
  button: { main: [['--pnb-fab', 'Button'], ['--pnb-on-fab', 'Glyph']] },
  board: {
    main: [['--pnb-bg', 'Page'], ['--pnb-surface', 'Card'], ['--pnb-text', 'Text']],
    more: [
      ['--pnb-text-quiet', 'Quiet text'],
      ['--pnb-sunken', 'Top / New switch'],
      ['--pnb-danger', 'Danger'],
      ['--pnb-bug', 'Bug badge'],
      ['--pnb-idea', 'Idea badge'],
      ['--pnb-review', 'Review badge'],
      ['--pnb-star', 'Stars'],
      ['--pnb-planned', 'Planned'],
      ['--pnb-declined', 'Not doing'],
    ],
  },
  tiles: {
    main: [['--pnb-tile-bug', 'Bug'], ['--pnb-tile-idea', 'Idea'], ['--pnb-tile-review', 'Review']],
    more: [['--pnb-tile-ink', 'Words on tiles']],
  },
  write: { main: [['--pnb-surface-2', 'Field'], ['--pnb-line', 'Lines']] },
  sent: { main: [['--pnb-sent', 'Behind'], ['--pnb-done', 'Tick and Done']] },
};

/** Every custom property the steps offer, for putting them on the widget. */
const PROPS = Object.values(COLOURS)
  .flatMap(({ main, more = [] }) => [...main, ...more])
  .map(([name]) => name)
  .filter((name) => name !== 'accent');

/**
 * The texts worth changing, per step, with the widget's own English words as
 * placeholders. A copy of `packages/widget/src/i18n.ts` for these keys only:
 * if a word changes there, change it here.
 */
const STRINGS = {
  button: { label: 'Label for screen readers', keys: [['board.open', 'Feedback']] },
  board: { label: 'Title', keys: [['board.title', 'Feedback']] },
  tiles: {
    label: 'Words on the tiles',
    keys: [['board.tileBug', 'Report a bug'], ['board.tileIdea', 'Share an idea'], ['board.tileReview', 'Write a review']],
  },
  write: { label: 'Send button', keys: [['board.send', 'Put it on the board']] },
  sent: { label: 'Title', keys: [['board.sent', 'Feedback sent!']] },
};

const form = document.getElementById('settings');
const screen = document.getElementById('screen');
const mark = document.getElementById('mark');
const backBtn = document.getElementById('back');
const nextBtn = document.getElementById('next');
const previewBtn = document.getElementById('preview');
const copyBtn = document.getElementById('copy');

const state = {
  appName: '',
  mode: 'floating',
  theme: 'pleasenobugs',
  kinds: ['bug', 'idea', 'review'],
  screenshots: true,
  accent: '',
  colours: {},
  strings: {},
};

/** The step on screen, by id, and whether the widget is being tried out. */
let at = 'settings';
let previewing = false;

/** The widget in the box. */
let board = null;

/** The steps there are for the current choices: no round button unless it is one. */
const route = () => STEPS.filter((s) => !s.floatingOnly || state.mode === 'floating');
const step = () => STEPS.find((s) => s.id === at);

// ---- The widget ----------------------------------------------------------

/** Put the settings on the widget: attributes, colours and texts. */
function apply(el) {
  const set = (name, value) => (value ? el.setAttribute(name, value) : el.removeAttribute(name));
  el.setAttribute('demo', '');
  el.setAttribute('mode', state.mode);
  set('theme', state.theme);
  set('lang', 'en');
  set('accent', state.accent);
  set('app-name', state.appName.trim());
  set('kinds', state.kinds.length === 3 ? '' : state.kinds.join(','));
  set('screenshots', state.screenshots ? '' : 'off');
  set('screen', previewing ? '' : step().screen);
  for (const name of PROPS) {
    if (state.colours[name]) el.style.setProperty(name, state.colours[name]);
    else el.style.removeProperty(name);
  }
  el.strings = Object.keys(state.strings).length ? { ...state.strings } : undefined;
}

/** A fresh widget in the box: for a new mode, and for a preview that starts as it would in an app. */
function mount() {
  board?.remove();
  screen.querySelector('.screen__again')?.remove();
  screen.classList.toggle('screen--inline', state.mode === 'inline');
  board = document.createElement('please-no-bugs');
  revealed = null;
  apply(board);
  screen.append(board);
  if (state.mode === 'overlay') board.addEventListener('pleasenobugs:close', offerAgain);
  fitPanel();
  observeRoot(board);
  watch();
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
  style.textContent = `@media (min-width: 640px) { .overlay, .overlay .app { max-height: ${h}px; } }`;
}

function update() {
  if (board) apply(board);
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
    const hit = TAPS.find(([sel]) => path.some((n) => n instanceof Element && n.matches(sel)));
    go(hit ? hit[1] : SCREEN_STEP[step().screen]);
  },
  true,
);

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
  document.getElementById('hint').textContent = 'Tap a part of the widget to jump to its step.';
  mount();
}

// ---- Settings ------------------------------------------------------------

form.addEventListener('input', (e) => {
  const t = e.target;
  if (t.name === 'appName') state.appName = t.value;
  else if (t.name === 'theme') state.theme = t.value;
  else if (t.name === 'screenshots') state.screenshots = t.checked;
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
function dot(name, label) {
  return `<div class="dot" data-row="${name}">
    <label class="swatch__dot"><input type="color" data-colour="${name}" aria-label="${label}" /></label>
    <span class="dot__name">${label}</span>
    <button type="button" class="swatch__reset" data-reset="${name}" aria-label="Back to the theme's ${label.toLowerCase()}" title="Back to the theme's">×</button>
  </div>`;
}

/** The same colour as a row, for the longer list behind "More colours". */
function swatchRow(name, label) {
  return `<div class="swatch" data-row="${name}">
    <label class="swatch__dot"><input type="color" data-colour="${name}" aria-label="${label}" /></label>
    <span class="swatch__name">${label}<small>${name}</small></span>
    <span class="swatch__hex"></span>
    <button type="button" class="swatch__reset" data-reset="${name}" aria-label="Back to the theme's ${label.toLowerCase()}" title="Back to the theme's">×</button>
  </div>`;
}

for (const box of form.querySelectorAll('[data-colours]')) {
  const { main, more } = COLOURS[box.dataset.colours];
  box.className = 'field';
  box.innerHTML = `<span>Colours</span>
    <div class="dots">${main.map(([n, l]) => dot(n, l)).join('')}</div>
    ${more ? `<details class="more-colours"><summary>More colours</summary><div class="swatches">${more.map(([n, l]) => swatchRow(n, l)).join('')}</div></details>` : ''}`;
}

/**
 * Show each colour as the widget has it now. A value is read from the widget
 * itself with the override lifted for a moment, so "the theme's" is always
 * what the theme really says, gradients included.
 */
function paintSwatches() {
  if (!board?.shadowRoot) return void requestAnimationFrame(paintSwatches);
  for (const row of form.querySelectorAll('[data-row]')) {
    const name = row.dataset.row;
    const own = name === 'accent' ? state.accent : state.colours[name];
    const prop = name === 'accent' ? '--pnb-accent' : name;
    const value = own || themeValue(prop);
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
  const { label, keys } = STRINGS[box.dataset.strings];
  box.className = 'field';
  box.innerHTML = `<span>${label}</span>${keys
    .map(([key, words]) => `<input class="input" data-string="${key}" maxlength="80" placeholder="${words}" aria-label="${label}: ${words}" />`)
    .join('')}`;
}

// ---- The code ------------------------------------------------------------

const attr = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function html() {
  const attrs = [
    ['project', 'YOUR_PROJECT_ID'],
    ['server', 'https://YOUR_SERVER'],
    state.mode !== 'inline' && ['mode', state.mode],
    ['theme', state.theme],
    state.accent && ['accent', state.accent],
    state.appName.trim() && ['app-name', state.appName.trim()],
    state.kinds.length < 3 && ['kinds', state.kinds.join(',')],
    !state.screenshots && ['screenshots', 'off'],
  ].filter(Boolean);
  const lines = [
    `<script src="https://unpkg.com/pleasenobugs@${VERSION}"></script>`,
    `<please-no-bugs`,
    ...attrs.map(([k, v]) => `  ${k}="${attr(v)}"`),
    `></please-no-bugs>`,
  ];
  if (Object.keys(state.strings).length) {
    // Safe inside a <script>: no "</script>" can come out of this.
    const json = JSON.stringify(state.strings, null, 2).replace(/</g, '\\u003c').replace(/\n/g, '\n  ');
    lines.push('<script>', `  document.querySelector('please-no-bugs').strings = ${json};`, '</script>');
  }
  return lines.join('\n');
}

function css() {
  const rows = Object.entries(state.colours).map(([k, v]) => `  ${k}: ${v};`);
  if (state.mode === 'inline') rows.unshift('  height: 600px; /* inline: give it a height, or it grows with its posts */');
  if (!rows.length) return "/* No colours changed: the theme's own are used. */";
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
}

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
