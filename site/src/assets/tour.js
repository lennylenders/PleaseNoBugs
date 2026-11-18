/**
 * The home page's tour. The page is a pretend app: the heading, its line
 * and "Watch demo", and the real widget in `demo` mode, its round button
 * kept out of sight until the tour needs it (site.css). "Watch demo" turns
 * the page into the configurator's pretend
 * app ("Your app" and its skeleton) and plays one story through, once,
 * then the heading is back.
 *
 * In the Nimiq look (`calm`) the same story, with the same words, is told
 * more quietly, after the Nimiq 2026 brand: the pretend app is a white
 * window at the right of a light stage, the big line stands at its left with
 * which scene of how many over it, the words fade in whole rather than being
 * typed, the users are plain circles, and scene 6 draws thin dashed lines
 * from each of them to the board (nimiq.css).
 *
 * It starts with why PleaseNoBugs is there, in six short scenes drawn on
 * the pretend app (`INTRO`; the drawing is site.css's), each with its big
 * line typed out: imagine this is your app, its first users, what each
 * says, scattered, most of them leaving without a word and what they said
 * left all over the place, the answer, a round button, and all that
 * feedback on one board everyone can see. "Skip intro" goes straight on.
 * Until then the box shows no round button at all. Then, big over the
 * dimmed app under a small "How it works", a title says whose side comes
 * next:
 *
 * - **Your user's perspective**, as a user meets it: tap the round button, pick
 *   Report a bug on the tiles, describe it, send it, and only then the
 *   board, with their bug on it and one other.
 * - **Your perspective**, the owner's (`demo="owner"`): the round button, the
 *   board, that same bug picked, marked fixed in a version with a link,
 *   answered, and the card as everybody now sees it.
 * - **Build your own widget.** (the classic look only; the Nimiq look goes
 *   from the owner's side straight to the end), under a small "Make it yours": one real
 *   widget in the middle, all grey, as on Customize, and a cursor that
 *   colours it in as Customize's sketch does: a tap on a part, the line round
 *   it with its name, a row of colours, a pick: its round button, then the
 *   Bug tile, then Idea and Review, quicker. Only then the widget goes back
 *   among the others, top left, smaller, where the cursor picks its
 *   background and taps the rest in, while grey copies pop up all around, on its tiles, board and "Feedback sent!", each
 *   coloured in by a little cursor of its own, more and more, faster and
 *   faster, each a look of the same purple family. Then a big round button
 *   pops up in the middle and gulps them all, squashes, stretches, pops, and
 *   the end bursts out of it.
 * - An end that stays: the whole story in three steps ("Your users speak.
 *   You fix. Everyone sees."), with "Make it yours" and "Watch again".
 *
 * Both boards hold only that bug and one other (`samples`), so the story is
 * all there is to look at. The owner's is a widget of its own, with the
 * user's bug already on it, as the user sent it.
 *
 * A subtitle says what each step is (`USER`, `OWNER`), a ring shows each
 * tap, as in the configurator's step 1; the subtitle is typed out before
 * the step it says. It does not pause: a click on the box's left third goes
 * back to the start of the part before (an intro scene, the user's side,
 * the owner's), on its right third on to the next, and its middle does
 * nothing; so do the arrow keys, and Esc stops it. Nothing shows this but
 * the cursor.
 *
 * The widget is `inert`: a visitor watches, nothing in it takes a tap. The
 * taps here are the widget's own buttons, clicked from this script, so what
 * plays is what the widget really does. A fresh widget every time, so the
 * demo board starts over too: its posts live only in the page's memory and
 * nothing leaves the browser. It waits while the box is off screen or the
 * tab is hidden.
 */
const box = document.getElementById('tour');
const frame = document.getElementById('tour-frame');
const page = box?.querySelector('.tour-page');
const subtitle = document.getElementById('tour-say');
const watch = document.getElementById('tour-watch');
const titleCard = document.getElementById('tour-title');
const endCard = document.getElementById('tour-end');
const again = document.getElementById('tour-again');
const intro = document.getElementById('tour-intro');
const caption = intro?.querySelector('.ti-caption');
const skip = document.getElementById('tour-skip');
const build = document.getElementById('tour-build');
const still = window.matchMedia('(prefers-reduced-motion: reduce)');

const said = document.getElementById('ti-said');

/**
 * The intro's scenes: the big line, typed out; the small one under it;
 * whether the drawing plays `during` the typing or after it; and how long
 * it plays on once the words are all there (ms, as drawn in site.css).
 */
const INTRO = [
  { title: 'Imagine this is your app.', line: '', ms: 3000 },
  { title: 'You gained your first users!', line: '', during: true, ms: 2000 },
  {
    title: 'They give feedback, all over the place.',
    line: 'In reviews, chats and DMs.',
    during: true,
    ms: 2000,
  },
  {
    title: 'And then most of your users leave, and never tell you why.',
    line: "Most apps don't die loudly.",
    during: true,
    ms: 2800,
  },
  {
    title: 'This open source feedback widget is your solution!',
    line: 'PleaseNoBugs: one button in your app.',
    ms: 3000,
  },
  {
    title: 'All your feedback in one place.',
    line: 'Visible to all your users.',
    ms: 3600,
  },
];

/** The intro's scenes: the same six in either look. */
const scenes = () => INTRO;

/**
 * Whether the site wears the Nimiq look (assets/style.js). There the tour is
 * calmer: the words fade in whole instead of being typed, the intro has its
 * own drawing (nimiq.css), and the app is a white window on the stage, the
 * widget inside it.
 */
const calm = () => document.documentElement.dataset.style === 'nimiq';

/**
 * The subtitles, one per step: about your user on one side, about you on
 * the other. Only the first says who; the rest go on from it.
 */
const USER = [
  'Your user taps the button',
  'Picks what it is',
  'Describes the bug',
  'Sends it',
  'Visible to everyone',
];
const OWNER = ['You open your board', 'Pick the bug you fixed', 'Mark it fixed', 'Answer the user', 'See it on the board'];

/** What the tour writes, typed out a letter at a time. */
const BUG = 'The save button does nothing on my phone';
/** The owner's, fixing that same bug. */
const VERSION = '1.4.3';
const PULL = 'github.com/you/app/pull/42';
const REPLY = 'Thanks for reporting! Fixed, it is in the next version.';

/**
 * One story on a quiet board: the bug the user sends, and one other bug of
 * somebody else's, still open. The user's board starts with that other bug
 * alone; the owner's has the user's bug too, as the user sent it.
 */
const OTHER = { kind: 'bug', text: 'The send button does nothing after I switch accounts', votes: 4, ago: 20 * 3_600_000 };
const SAMPLES = {
  user: [OTHER],
  owner: [{ kind: 'bug', text: BUG, votes: 1, ago: 3_600_000 }, OTHER],
};

/** The same settings as the configurator's widgets, and no screenshots: the tour never adds one. */
function widget(pov) {
  const el = document.createElement('please-no-bugs');
  for (const [k, v] of Object.entries({
    demo: pov === 'owner' ? 'owner' : '',
    mode: 'floating',
    theme: window.PNBStyle?.theme() ?? 'pleasenobugs',
    lang: 'en',
    screenshots: 'off',
    // An owner comes for the board; a user, as in an app, to the tiles.
    ...(pov === 'owner' ? { start: 'board' } : {}),
  })) {
    el.setAttribute(k, v);
  }
  el.samples = SAMPLES[pov === 'owner' ? 'owner' : 'user'];
  el.inert = true;
  el.setAttribute('aria-hidden', 'true');
  return el;
}

/**
 * The widget sizes its corner panel to the window (at most 640px high), and
 * the box is shorter: without this its top would be cut off. As `fitPanel`
 * in customize.js, put in from here rather than in the widget. And no
 * "Said already, maybe?" while the bug is typed: the sample board has one
 * like it, and in a tour it is one thing too many. And what the tour taps
 * comes forward a little (`lift`), a soft shadow under it, and is pressed
 * in for a moment as it is tapped, as under a finger.
 */
function fit(el) {
  let style = el.shadowRoot.querySelector('style[data-site]');
  if (!style) {
    style = document.createElement('style');
    style.dataset.site = '';
    el.shadowRoot.append(style);
  }
  // In the Nimiq look the app is a window on the stage, at its right: the
  // round button, the panel and what dims behind it stay inside that window.
  const a = calm() ? box.querySelector('.tour-app') : null;
  const w = a
    ? { t: a.offsetTop, l: a.offsetLeft, r: box.clientWidth - a.offsetLeft - a.offsetWidth, b: box.clientHeight - a.offsetTop - a.offsetHeight }
    : null;
  const h = box.clientHeight - 48 - (w ? w.t + w.b : 0);
  const inset = w
    ? ` .fab { right: ${16 + w.r}px; bottom: ${16 + w.b}px; }` +
      ` .overlay { inset: ${w.t}px ${w.r}px ${w.b}px ${w.l}px; border-radius: 14px; overflow: hidden; }` +
      ` @media (min-width: 640px) { .overlay { inset: auto ${24 + w.r}px ${24 + w.b}px auto; }` +
      ` .backdrop { inset: ${w.t}px ${w.r}px ${w.b}px ${w.l}px; border-radius: 14px; } }`
    : '';
  // The owner's page for answering a post, as tall as the box allows, so
  // what they fill in is not squeezed into a short panel.
  style.textContent =
    inset +
    `@media (min-width: 640px) { .overlay, .overlay .app { max-height: ${h}px; }` +
    ` .overlay .app:has(.manage) { height: ${h}px; } }` +
    ` .alike { display: none !important; }` +
    ` [data-tour-lift] { z-index: 1; transform: translateY(-1px) scale(1.03) !important;` +
    ` box-shadow: 0 6px 16px rgba(10, 10, 30, 0.28) !important;` +
    ` transition: transform 240ms ease, box-shadow 240ms ease !important; }` +
    ` [data-tour-lift][data-tour-press] { transform: scale(0.97) !important;` +
    ` box-shadow: 0 2px 6px rgba(10, 10, 30, 0.22) !important; transition-duration: 90ms !important; }` +
    ` @media (prefers-reduced-motion: reduce) { [data-tour-lift] { transition: none !important; } }`;
}

/** A fresh widget in the box, the old one and any ring gone. */
function mount(pov) {
  for (const old of box.querySelectorAll('please-no-bugs, .tour-tap')) old.remove();
  const el = widget(pov);
  box.append(el);
  fit(el);
  return el;
}

// ---- Time: it only runs while it plays, where it can be seen ----------

/** Thrown out of a tour that was stopped. */
const STOP = Symbol('stop');
/** Which tour is current, and which is running: one that is not current stops at its next wait. */
let current = 0;
let running = 0;
let seen = true;

/** How much longer every pause is than the numbers below say: time to take each step in. */
const PACE = 1.5;

/**
 * `ms` of the tour's own time, counted in short steps: none passes while it
 * is out of sight, and a stop ends it within a step.
 */
async function sleep(ms) {
  let left = ms;
  while (left > 0) {
    const step = Math.min(left, 50);
    await new Promise((r) => setTimeout(r, step));
    if (running !== current) throw STOP;
    if (seen) left -= step;
  }
}
/** A pause between steps. Typing and taps keep their speed. */
const wait = (ms) => sleep(ms * PACE);

function watchSight() {
  let onScreen = true;
  const update = () => (seen = onScreen && !document.hidden);
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    update();
  }).observe(box);
  document.addEventListener('visibilitychange', update);
}

// ---- What the tour does --------------------------------------------------

/** The widget's own element, by a selector in its shadow root, once it is there. */
async function find(el, selector, tries = 40) {
  for (let i = 0; i < tries; i++) {
    const found = typeof selector === 'function' ? selector(el.shadowRoot) : el.shadowRoot.querySelector(selector);
    if (found) return found;
    await sleep(50);
  }
  throw new Error(`Tour: no ${selector}`);
}

/**
 * Two rings going out from `target`, the round button, as it popped up in
 * the intro: here it is, before it is tapped.
 */
async function pulse(target) {
  const b = box.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const el = document.createElement('span');
  el.className = 'tour-pulse';
  Object.assign(el.style, {
    left: `${t.left - b.left}px`,
    top: `${t.top - b.top}px`,
    width: `${t.width}px`,
    height: `${t.height}px`,
  });
  box.append(el);
  try {
    await sleep(1900);
  } finally {
    el.remove();
  }
}

/** The tap's ring, once, over `target`. */
function ring(target) {
  const b = box.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const el = document.createElement('span');
  el.className = 'tour-tap';
  el.style.left = `${t.left + t.width / 2 - b.left}px`;
  el.style.top = `${t.top + t.height / 2 - b.top}px`;
  box.append(el);
  // The next frame, so the ring starts from its resting state.
  requestAnimationFrame(() => el.classList.add('tour-tap--on'));
  setTimeout(() => el.remove(), 600);
}

/**
 * Bring `target`, in the widget, forward, and the one before it back. It
 * stays forward until the next tap, or until the widget moves on and it is
 * gone. An attribute rather than a class, which the widget leaves alone when
 * it draws the element again.
 */
function lift(target) {
  const root = target.getRootNode();
  for (const old of root.querySelectorAll?.('[data-tour-lift]') ?? []) old.removeAttribute('data-tour-lift');
  target.setAttribute('data-tour-lift', '');
}

/**
 * Show a tap on `target`, brought forward first, then tap it: pressed in as
 * the ring shows, and up again, still forward, as the tap lands.
 */
async function tap(target) {
  lift(target);
  await sleep(300);
  ring(target);
  target.setAttribute('data-tour-press', '');
  await sleep(160);
  target.click();
  setTimeout(() => target.removeAttribute('data-tour-press'), 120);
}

/** Scroll the panel, or the page in it, just enough to show `target`, so a tap on it is seen. */
async function reveal(target) {
  const list = target.closest('.scroll');
  if (!list) return;
  const l = list.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const by = t.bottom > l.bottom - 24 ? t.bottom - l.bottom + 24 : t.top < l.top + 24 ? t.top - l.top - 24 : 0;
  if (!by) return;
  list.scrollBy({ top: by, behavior: still.matches ? 'auto' : 'smooth' });
  await wait(600);
}

/** Type `text` into a field of the widget's, the way a person would, as the widget hears it. */
async function type(field, text) {
  for (let i = 1; i <= text.length; i++) {
    field.value = text.slice(0, i);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(40 + Math.random() * 35);
  }
}

/** A button in the panel's bar, by its label. */
const barButton = (label) => (root) => root.querySelector(`.bar [aria-label="${label}"]`);
/** The card whose text starts with `text`. */
const card = (text) => (root) =>
  [...root.querySelectorAll('.card')].find((c) => c.querySelector('.card__text')?.textContent.startsWith(text));
/** A button by what it says. */
const button = (selector, text) => (root) =>
  [...root.querySelectorAll(selector)].find((b) => b.textContent.trim() === text);

/**
 * Put step `n` (from 1) of `steps` in the subtitle, the old one fading out
 * first, typed out as the intro's words are; the step waits for it. A
 * screen reader hears it whole.
 */
async function say(steps, n) {
  const text = steps[n - 1];
  const shown = subtitle.querySelector('.tour-say__title');
  subtitle.classList.add('tour-say--away');
  await sleep(180);
  shown.textContent = '';
  subtitle.querySelector('[role="status"]').textContent = text;
  // Which step of how many, shown small above it in the Nimiq look.
  subtitle.dataset.step = `${String(n).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
  if (calm()) {
    // Whole, faded in (nimiq.css), and a moment to read it.
    shown.textContent = text;
    subtitle.classList.remove('tour-say--away');
    await sleep(700);
    return;
  }
  subtitle.classList.remove('tour-say--away');
  subtitle.classList.add('tour-say--typing');
  try {
    for (let i = 1; i <= text.length; i++) {
      shown.textContent = text.slice(0, i);
      await sleep(42);
    }
    await sleep(250);
  } finally {
    shown.textContent = text;
    subtitle.classList.remove('tour-say--typing');
  }
}

/**
 * `text` big over the dimmed app for a moment, `kicker` small above it, then
 * faded out; the subtitle waits meanwhile. `under` runs once it covers the
 * app, to change what is under it unseen.
 */
async function title(text, kicker = '', under = () => {}) {
  titleCard.querySelector('small').textContent = kicker;
  titleCard.querySelector('b').textContent = text;
  titleCard.classList.remove('tour-title--away');
  titleCard.hidden = false;
  frame.classList.add('tour--title');
  try {
    await sleep(320);
    under();
    await wait(1400);
    titleCard.classList.add('tour-title--away');
    await sleep(320);
  } finally {
    titleCard.hidden = true;
    // The last side's subtitle stays out of sight until the next one says its first step.
    subtitle.classList.add('tour-say--away');
    frame.classList.remove('tour--title');
  }
}

/** Whether "Skip intro" was clicked in this play. */
let skipped = false;

/** `ms` of the intro's time, as `sleep`, but over at once on "Skip intro". */
async function hold(ms) {
  let left = ms;
  while (left > 0 && !skipped) {
    await new Promise((r) => setTimeout(r, 50));
    if (running !== current) throw STOP;
    if (seen) left -= 50;
  }
}

/** Scene 1's arrow: just right of "Your app", level with it, pointing at it. */
function placeArrow() {
  const label = box.querySelector('.tour-app b');
  const arrow = intro.querySelector('.ti-arrow:not(.ti-arrow--fab)');
  if (!label || !arrow) return;
  const b = box.getBoundingClientRect();
  const r = label.getBoundingClientRect();
  arrow.style.left = `${r.right - b.left + 18}px`;
  arrow.style.top = `${r.top + r.height / 2 - b.top - arrow.getBoundingClientRect().height / 2}px`;
}

/**
 * Scene 5's round button: drawn where the real one sits, with its colours
 * and icon, as the real one stays hidden until the intro is over; and its
 * arrow, just left of it, level with it, pointing at it.
 */
function drawFab() {
  const fab = box.querySelector('please-no-bugs')?.shadowRoot?.querySelector('.fab');
  const drawn = intro.querySelector('.ti-fab');
  if (!fab) return;
  const b = box.getBoundingClientRect();
  const r = fab.getBoundingClientRect();
  const look = getComputedStyle(fab);
  Object.assign(drawn.style, {
    left: `${r.left - b.left}px`,
    top: `${r.top - b.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    background: look.backgroundColor,
    color: look.color,
  });
  drawn.innerHTML = fab.querySelector('svg')?.outerHTML ?? '';
  // On a phone the words run up to the button: there it points down at it
  // from above instead.
  const arrow = intro.querySelector('.ti-arrow--fab');
  const down = box.clientWidth < 640;
  arrow.classList.toggle('ti-arrow--down', down);
  arrow.setAttribute('viewBox', down ? '0 0 24 56' : '0 0 56 24');
  arrow.querySelector('path').setAttribute('d', down ? 'M12 4V50M12 50l-8-9M12 50l8-9' : 'M4 12H50M50 12l-9-8M50 12l-9 8');
  const a = arrow.getBoundingClientRect();
  if (down) {
    arrow.style.left = `${r.left + r.width / 2 - b.left - a.width / 2}px`;
    arrow.style.top = `${r.top - b.top - 14 - a.height}px`;
  } else {
    arrow.style.left = `${r.left - b.left - 18 - a.width}px`;
    arrow.style.top = `${r.top + r.height / 2 - b.top - a.height / 2}px`;
  }
}

/**
 * Scene 6's board: right above the round button it opens from, as the
 * widget's own panel. Where the words would be under it (a phone, a narrow
 * box), right above the words instead, still at the button's side. Never
 * under "Skip intro".
 */
function placeBoard() {
  const board = intro.querySelector('.ti-board');
  const fab = intro.querySelector('.ti-fab').getBoundingClientRect();
  const b = box.getBoundingClientRect();
  const r = board.getBoundingClientRect();
  // The words as they stand, not the box they may fill.
  const words = document.createRange();
  words.selectNodeContents(caption);
  const w = words.getBoundingClientRect();
  let bottom = fab.top - b.top - 12;
  if (r.left < w.right && bottom > w.top - b.top - 12) bottom = w.top - b.top - 12;
  intro.style.setProperty('--bt', `${Math.max(58, bottom - r.height)}px`);
}

/** A curve from (x1, y1) up or down to (x2, y2), leaving and arriving upright. */
function curve(x1, y1, x2, y2) {
  return `M${x1} ${y1}C${x1} ${(y1 + y2) / 2} ${x2} ${(y1 + y2) / 2} ${x2} ${y2}`;
}

/**
 * Level from (x1, y1) to the right, then round the corner and down to
 * (x2, y2): clear of the words in the bottom left on its way to the button.
 */
function elbow(x1, y1, x2, y2) {
  const r = Math.max(0, Math.min(20, x2 - x1, y2 - y1));
  return `M${x1} ${y1}H${x2 - r}Q${x2} ${y1} ${x2} ${y1 + r}V${y2}`;
}

/**
 * The Nimiq look's lines (nimiq.css draws them, dashed, in scene 6): from
 * each user to the board, as if all of them look at the one place now. Made
 * once, then only moved, so a line being drawn goes on.
 */
function placeLines() {
  const svg = intro.querySelector('.nq-lines');
  if (!svg || !calm()) return;
  const o = svg.getBoundingClientRect();
  const board = intro.querySelector('.ti-board').getBoundingClientRect();
  const bx = board.left + board.width / 2 - o.left;
  const by = board.top + board.height / 2 - o.top;
  intro.querySelectorAll('.ti-person').forEach((user, i) => {
    const u = user.getBoundingClientRect();
    let path = svg.children[i];
    if (!path) {
      path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.style.setProperty('--i', String(i));
      svg.append(path);
    }
    path.setAttribute('d', `M${u.left + u.width / 2 - o.left} ${u.top + u.height / 2 - o.top}L${bx} ${by}`);
  });
}

/** Start scene `n`'s drawing. */
function draw(n) {
  if (n === 1) placeArrow();
  if (n === 5) drawFab();
  if (n === 6) placeBoard();
  placeLines();
  frame.dataset.intro = String(n);
  // The round button, tapped: the board opens from it.
  if (n === 6) ring(intro.querySelector('.ti-fab'));
}

/**
 * Scene `n` (from 1): the old words out, the big line typed, the small one
 * after it; its drawing while it is typed, or after.
 */
async function scene(n) {
  const { during, title: big, line } = scenes()[n - 1];
  // Which scene of how many, small over the big line in the Nimiq look.
  caption.dataset.step = `${String(n).padStart(2, '0')} / ${String(scenes().length).padStart(2, '0')}`;
  caption.classList.add('ti-caption--away');
  await hold(calm() ? 450 : 250);
  if (skipped) return;
  if (during && !calm()) draw(n);
  const bigEl = caption.querySelector('b');
  bigEl.textContent = '';
  caption.querySelector('span').textContent = line;
  if (calm()) {
    // The Nimiq look: the big line fades in whole as its drawing starts (the
    // words in first, so the drawing can keep clear of them), the small one
    // after it, and as long to read as typing it would have taken.
    bigEl.textContent = big;
    draw(n);
    caption.classList.remove('ti-caption--away', 'ti-caption--line');
    said.textContent = line ? `${big} ${line}` : big;
    await hold(700);
    caption.classList.add('ti-caption--line');
    await hold(Math.min(1400, big.length * 22));
    return;
  }
  caption.classList.remove('ti-caption--away', 'ti-caption--line');
  caption.classList.add('ti-caption--typing');
  // Said whole for a screen reader; the letters are for the eye.
  said.textContent = line ? `${big} ${line}` : big;
  for (let i = 1; i <= big.length && !skipped; i++) {
    bigEl.textContent = big.slice(0, i);
    await hold(i === big.length ? 0 : 42);
  }
  bigEl.textContent = big;
  await hold(300);
  caption.classList.remove('ti-caption--typing');
  caption.classList.add('ti-caption--line');
  if (!during && !skipped) draw(n);
}

/** Why PleaseNoBugs is there, in six scenes, unless skipped. */
async function playIntro(from = 1) {
  skipped = false;
  // A fresh widget, closed, whatever a later part left open: scene 5 draws
  // its round button where this one's sits.
  const el = mount('user');
  intro.hidden = false;
  skip.hidden = false;
  skip.focus({ preventScroll: true });
  // No widget or subtitle from the start; the drawing waits for scene 1. A
  // later scene starts where the one before it ended.
  frame.dataset.intro = '0';
  if (from > 1) {
    await find(el, '.fab');
    settle(from - 1);
  }
  for (let n = from; n <= scenes().length && !skipped; n++) {
    chapter = n - 1;
    await scene(n);
    await hold(scenes()[n - 1].ms);
  }
}

/** The intro drawn as scene `n` (from 1) left it, at once: for starting at the scene after it. */
function settle(n) {
  if (n === 1) placeArrow();
  // From scene 5 on the round button is there, from 6 on the board too.
  if (n >= 5) drawFab();
  if (n >= 6) placeBoard();
  placeLines();
  frame.dataset.intro = String(n);
  // Every movement of that scene at its end. Not the cursor, which blinks
  // for ever and has no end.
  for (const a of document.getAnimations()) {
    if (inFrame(a.effect?.target) && a.effect?.getComputedTiming().endTime !== Infinity) a.finish();
  }
}

/** The intro gone, the app and the widget as they were. */
function endIntro() {
  const hadFocus = skip.contains(document.activeElement);
  delete frame.dataset.intro;
  intro.hidden = true;
  skip.hidden = true;
  caption.classList.add('ti-caption--away');
  caption.classList.remove('ti-caption--typing', 'ti-caption--line');
  said.textContent = '';
  if (hadFocus && frame.classList.contains('tour--playing')) subtitle.focus({ preventScroll: true });
}

/** The whole story: why, then the user sends a bug, and the owner fixes it. */
async function story(from = 0) {
  if (from < scenes().length) await playIntro(from + 1);
  if (from <= userPart()) {
    chapter = userPart();
    await title("Your user's perspective", 'How it works', endIntro);
    await userRound();
  }
  if (from <= ownerPart()) {
    chapter = ownerPart();
    await title('Your perspective', 'How it works', endIntro);
    await ownerRound();
  }
  // The Nimiq look keeps to the feedback itself: from the owner's side
  // straight to the end, without "Build your own widget.".
  if (calm()) return;
  chapter = buildPart();
  await title('Build your own widget.', 'Make it yours', () => {
    endIntro();
    stage();
  });
  await buildRound();
}

/**
 * The story's parts, to go back or on by: the intro's scenes (0 to 5), the
 * user's side, the owner's, and "Build your own
 * widget.". On from that is the end.
 */
const userPart = () => scenes().length;
const ownerPart = () => scenes().length + 1;
const buildPart = () => scenes().length + 2;
/** The part playing now. */
let chapter = 0;

/** The app user's side. */
async function userRound() {
  const el = mount('user');

  const fab = await find(el, '.fab');
  await say(USER, 1);
  await wait(300);
  await pulse(fab);
  await wait(300);
  await tap(fab);

  // The tiles: a bug.
  const tile = await find(el, '.tile--bug');
  await say(USER, 2);
  await wait(2200);
  await tap(tile);

  // Written and sent.
  const field = await find(el, 'textarea.field');
  await say(USER, 3);
  await wait(1200);
  await type(field, BUG);
  await wait(800);
  const send = await find(el, '.send .btn:not([disabled])');
  await reveal(send);
  await tap(send);
  await find(el, '.sent');
  await say(USER, 4);

  // Only now the board, with their bug on it. The widget goes there by
  // itself after "Feedback sent!", as in an app.
  await find(el, card(BUG), 100);
  await wait(600);
  await say(USER, 5);
  await wait(3600);

  await tap(await find(el, barButton('Close')));
  await wait(900);
}

/** The app owner's side. */
async function ownerRound() {
  const el = mount('owner');

  const fab = await find(el, '.fab');
  await say(OWNER, 1);
  await wait(300);
  await pulse(fab);
  await wait(300);
  await tap(fab);
  await find(el, '.list');
  await wait(1600);

  // The user's bug: a tap on a card opens the owner's page for it.
  const bug = await find(el, card(BUG));
  await say(OWNER, 2);
  await reveal(bug);
  await wait(1400);
  await tap(bug);

  // Fixed, with the version it is fixed in and the pull request.
  const done = await find(el, button('.manage .states .chip-pick', 'Fixed'));
  await say(OWNER, 3);
  await wait(1200);
  await reveal(done);
  await tap(done);
  const [version, link] = await find(el, (root) => {
    const inputs = root.querySelectorAll('.fix-box input');
    return inputs.length === 2 ? [...inputs] : null;
  });
  await reveal(version);
  await wait(500);
  await type(version, VERSION);
  await wait(300);
  await reveal(link);
  await type(link, PULL);
  await wait(900);

  // A word to the person who reported it.
  const reply = await find(el, '.manage textarea.field');
  await say(OWNER, 4);
  await reveal(reply);
  await wait(600);
  await type(reply, REPLY);
  await wait(800);
  const save = await find(el, '.manage__actions .btn:not([disabled])');
  await reveal(save);
  await tap(save);

  // The card, as everybody sees it now.
  const fixed = await find(el, (root) => !root.querySelector('.manage') && card(BUG)(root)?.querySelector('.fix') && card(BUG)(root));
  await say(OWNER, 5);
  await reveal(fixed);
  await wait(3000);
}

// ---- Build your own widget ----------------------------------------------

/** Its subtitles: what the cursor does, then the switch, then everyone else's. */
const BUILD = ['Tap a part, pick its colour', 'Everyone builds their own'];

/** The widget's colours, by a short name. */
const VAR = {
  bg: '--pnb-bg',
  surface: '--pnb-surface',
  surface2: '--pnb-surface-2',
  sunken: '--pnb-sunken',
  line: '--pnb-line',
  text: '--pnb-text',
  quiet: '--pnb-text-quiet',
  accent: '--pnb-accent',
  fill: '--pnb-accent-fill',
  onAccent: '--pnb-on-accent',
  raise: '--pnb-raise',
  fab: '--pnb-fab',
  onFab: '--pnb-on-fab',
  bug: '--pnb-bug',
  idea: '--pnb-idea',
  review: '--pnb-review',
  done: '--pnb-done',
  sent: '--pnb-sent',
  sentTitle: '--pnb-sent-title',
  sentNote: '--pnb-sent-note',
  radius: '--pnb-radius',
  pill: '--pnb-radius-pill',
  inkBug: '--pnb-tile-ink-bug',
  inkIdea: '--pnb-tile-ink-idea',
  inkReview: '--pnb-tile-ink-review',
  tileBug: '--pnb-tile-bug',
  tileIdea: '--pnb-tile-idea',
  tileReview: '--pnb-tile-review',
};

/**
 * A whole look, every colour above set, the rest following from the few
 * given. A tile is painted in its kind's colour unless the look paints it
 * otherwise (a gradient, say).
 */
function look(o) {
  const all = {
    sunken: o.surface2,
    fill: o.accent,
    raise: 'none',
    fab: o.accent,
    onFab: o.onAccent,
    bug: '#e5484d',
    idea: '#8b5cf6',
    review: '#e9a00b',
    done: '#21bca5',
    sent: o.bg,
    sentTitle: o.text,
    sentNote: o.quiet,
    radius: '8px',
    pill: '999px',
    inkBug: '#ffffff',
    inkIdea: '#ffffff',
    inkReview: '#ffffff',
    ...o,
  };
  all.tileBug ??= all.bug;
  all.tileIdea ??= all.idea;
  all.tileReview ??= all.review;
  return Object.fromEntries(Object.entries(all).map(([k, v]) => [VAR[k], v]));
}

/**
 * Looks one could make, as different as apps are: dark ones in many
 * colours and styles (teal, charcoal and amber, forest, wine, neon, mono,
 * PleaseNoBugs' own, the widget's dark theme, grape) and light ones
 * (pastel lavender, mint, paper, sky, peach), with tiles of their own:
 * warm, pastel, neon, grey, earthy, in gradients. Dark and light take
 * turns, so no two side by side look alike.
 */
const LOOKS = [
  // Midnight teal, round.
  look({ bg: '#0f2a2e', surface: '#173d42', surface2: '#1f4d53', sunken: '#091c1f', line: '#2b6168', text: '#e6fbfa', quiet: '#9cc9c6', accent: '#2dd4bf', onAccent: '#062b27', bug: '#f87171', idea: '#38bdf8', review: '#fbbf24', inkReview: '#3a2a00', radius: '14px' }),
  // Pastel lavender: soft tiles, dark words on them.
  look({ bg: '#f5f3ff', surface: '#ebe7fe', surface2: '#ddd6fe', line: '#c4b5fd', text: '#2e1065', quiet: '#6d5aa8', accent: '#7c3aed', onAccent: '#ffffff', bug: '#fda4af', idea: '#c4b5fd', review: '#fcd34d', inkBug: '#881337', inkIdea: '#4c1d95', inkReview: '#78350f', radius: '16px' }),
  // Charcoal and amber, square: warm tiles.
  look({ bg: '#18181b', surface: '#27272a', surface2: '#3f3f46', sunken: '#09090b', line: '#3f3f46', text: '#fafafa', quiet: '#a1a1aa', accent: '#f59e0b', onAccent: '#18181b', bug: '#dc2626', idea: '#ea580c', review: '#ca8a04', radius: '3px', pill: '4px' }),
  // Mint.
  look({ bg: '#f0fdf8', surface: '#dcfce9', surface2: '#c7f5dc', line: '#a7e8c5', text: '#0b3a26', quiet: '#3f6b57', accent: '#10b981', onAccent: '#ffffff', bug: '#fb7185', idea: '#14b8a6', review: '#f59e0b', radius: '18px' }),
  // Forest, with tiles in gradients.
  look({
    bg: '#10241a',
    surface: '#1b3a2a',
    surface2: '#24503a',
    sunken: '#08140e',
    line: '#2f6b4c',
    text: '#ecfdf3',
    quiet: '#a7c9b5',
    accent: '#4ade80',
    onAccent: '#0b1f14',
    bug: '#f43f5e',
    idea: '#22c55e',
    review: '#f59e0b',
    tileBug: 'linear-gradient(135deg, #f43f5e, #fb923c)',
    tileIdea: 'linear-gradient(135deg, #16a34a, #4ade80)',
    tileReview: 'linear-gradient(135deg, #d97706, #facc15)',
    radius: '12px',
  }),
  // Paper: earthy tiles, sharp corners.
  look({ bg: '#f7f3ea', surface: '#ece5d6', surface2: '#e0d7c3', line: '#d3c7ad', text: '#2b2520', quiet: '#6b6157', accent: '#2b2520', onAccent: '#f7f3ea', bug: '#b4532a', idea: '#5b7c4a', review: '#c58b2b', radius: '2px', pill: '4px' }),
  // PleaseNoBugs' own: navy, purples, turquoise, raised.
  look({
    bg: '#292a56',
    surface: '#5656ac',
    surface2: '#454689',
    sunken: '#1a1a32',
    line: '#6d6dc5',
    text: '#ffffff',
    quiet: 'rgba(255, 255, 255, 0.78)',
    accent: '#1fc7d4',
    fill: 'linear-gradient(#1fc7d4, #1aa3ae)',
    onAccent: '#12132b',
    onFab: '#ffffff',
    raise: 'inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -2px 0 rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.4)',
  }),
  // Sky, with tiles in gradients.
  look({
    bg: '#f0f7ff',
    surface: '#e0edff',
    surface2: '#cfe2ff',
    line: '#b6d2fb',
    text: '#0f2a4a',
    quiet: '#4a6688',
    accent: '#2563eb',
    onAccent: '#ffffff',
    bug: '#ef4444',
    idea: '#6366f1',
    review: '#f59e0b',
    tileBug: 'linear-gradient(135deg, #ef4444, #f97316)',
    tileIdea: 'linear-gradient(135deg, #6366f1, #22d3ee)',
    tileReview: 'linear-gradient(135deg, #f59e0b, #fde047)',
    inkReview: '#3b2a00',
    radius: '10px',
  }),
  // Wine.
  look({ bg: '#2a0f1a', surface: '#451a2b', surface2: '#5a2238', sunken: '#1a0910', line: '#6d2a44', text: '#fff0f5', quiet: '#e0aac0', accent: '#fb7185', onAccent: '#2a0f1a', bug: '#e11d48', idea: '#c026d3', review: '#f97316', radius: '10px' }),
  // Peach.
  look({ bg: '#fff5ee', surface: '#ffe8d9', surface2: '#ffd9c2', line: '#fcc5a5', text: '#4a2311', quiet: '#8a5a43', accent: '#f97316', onAccent: '#ffffff', bug: '#e11d48', idea: '#a855f7', review: '#0ea5e9', radius: '14px' }),
  // Neon on ink-blue.
  look({ bg: '#0b1026', surface: '#141c3d', surface2: '#1d2752', sunken: '#060918', line: '#2a3670', text: '#e0e7ff', quiet: '#94a3d8', accent: '#22d3ee', onAccent: '#0b1026', bug: '#ff2e63', idea: '#7c3aed', review: '#00c896', radius: '6px' }),
  // The widget's own dark theme.
  look({ bg: '#15151c', surface: '#22222c', surface2: '#2e2e3a', sunken: '#0d0d12', line: '#383846', text: '#f2f2f7', quiet: '#a9a9ba', accent: '#6b93ff', onAccent: '#0b0b12' }),
  // Mono: black, white and greys, square.
  look({ bg: '#0c0c0c', surface: '#1c1c1c', surface2: '#2a2a2a', sunken: '#000000', line: '#333333', text: '#ffffff', quiet: '#9a9a9a', accent: '#ffffff', onAccent: '#0c0c0c', bug: '#3a3a3a', idea: '#2b2b2b', review: '#4a4a4a', done: '#ffffff', radius: '2px', pill: '2px' }),
  // Grape.
  look({ bg: '#2e1065', surface: '#4c1d95', surface2: '#3e1780', sunken: '#1e0a45', line: '#6d28d9', text: '#ffffff', quiet: '#d6c8fb', accent: '#ddd6fe', onAccent: '#2e1065', bug: '#f43f5e', idea: '#a78bfa', review: '#f59e0b' }),
];

/**
 * Every colour before it is picked: Customize's greys, so the widget is a
 * sketch until it is somebody's.
 */
const GREY = Object.fromEntries(
  Object.entries({
    bg: '#4a4b60',
    surface: '#5d5e75',
    surface2: '#56576d',
    sunken: '#3d3e50',
    line: '#6c6d84',
    text: '#d4d5e0',
    quiet: '#a3a4b6',
    accent: '#7d7e95',
    fill: '#7d7e95',
    onAccent: '#ffffff',
    raise: 'none',
    fab: '#6c6d84',
    onFab: 'rgba(255, 255, 255, 0.6)',
    bug: '#6c6d84',
    idea: '#6c6d84',
    review: '#6c6d84',
    tileBug: '#6c6d84',
    tileIdea: '#6c6d84',
    tileReview: '#6c6d84',
    done: '#7d7e95',
    sent: '#4a4b60',
    sentTitle: '#d4d5e0',
    sentNote: '#a3a4b6',
    radius: '8px',
    pill: '999px',
    inkBug: 'rgba(255, 255, 255, 0.55)',
    inkIdea: 'rgba(255, 255, 255, 0.55)',
    inkReview: 'rgba(255, 255, 255, 0.55)',
  }).map(([k, v]) => [VAR[k], v]),
);

/**
 * The look the first widget gets: PleaseNoBugs' own, navy and purples, its
 * round button turquoise as on the site, the tiles in their kinds' colours.
 */
const MINE_LOOK = look({
  bg: '#292a56',
  surface: '#5656ac',
  surface2: '#454689',
  sunken: '#1a1a32',
  line: '#6d6dc5',
  text: '#ffffff',
  quiet: 'rgba(255, 255, 255, 0.78)',
  accent: '#1fc7d4',
  fill: 'linear-gradient(#1fc7d4, #1aa3ae)',
  onAccent: '#12132b',
  fab: '#1fc7d4',
  onFab: '#ffffff',
});

/** The rows of colours the cursor picks from, as on Customize: six that suit the part, and any colour at all. */
const ROWS = {
  bright: ['#1fc7d4', '#e5484d', '#8b5cf6', '#e9a00b', '#21bca5', '#6d6dc5'],
  ground: ['#292a56', '#1e1640', '#0f2a2e', '#18181b', '#f5f3ff', '#ffffff'],
};

/**
 * The same scene in the Nimiq look: looks of the Nimiq 2026 family only,
 * navy and white with the brand's gold-to-red steps, light and dark taking
 * turns; the first widget gets the widget's own `nimiq` theme, gold round
 * button and all; and the rows of colours are the brand's.
 */
const NQ = {
  white: '#ffffff', paper: '#fafaf8', grey5: '#f2f3f4', grey10: '#e6e6e9', grey20: '#cdcdd3', grey40: '#9b9ca7',
  grey60: '#686a7c', grey70: '#4f5166', navy80: '#363950', navy90: '#1d203a', navy: '#040724',
  gold: '#ffb700', gold400: '#ffc758', gold100: '#ffefc5', gold50: '#fff8e4', orange: '#f27700', red700: '#e93700', red: '#cb0015', wine: '#6d001e',
};
const NIMIQ_MINE = look({
  bg: NQ.white, surface: NQ.paper, surface2: NQ.grey5, sunken: NQ.grey5, line: NQ.grey10, text: NQ.navy, quiet: NQ.grey60,
  accent: NQ.navy, onAccent: NQ.white, fab: NQ.gold, onFab: NQ.navy, bug: NQ.red, idea: NQ.gold, review: NQ.grey70, done: NQ.navy,
  inkIdea: NQ.navy, radius: '10px',
});
const NIMIQ_LOOKS = [
  look({ bg: NQ.navy, surface: NQ.navy90, surface2: NQ.navy80, sunken: '#02030f', line: NQ.navy80, text: NQ.white, quiet: NQ.grey40, accent: NQ.white, onAccent: NQ.navy, fab: NQ.gold, onFab: NQ.navy, bug: NQ.red700, idea: NQ.gold, review: NQ.grey40, done: NQ.white, inkIdea: NQ.navy, inkReview: NQ.navy, radius: '10px' }),
  look({ bg: NQ.gold50, surface: NQ.gold100, surface2: '#ffe3a4', line: '#ffd785', text: NQ.wine, quiet: '#9d0020', accent: NQ.red700, onAccent: NQ.white, bug: NQ.red, idea: NQ.orange, review: NQ.gold, inkReview: NQ.wine, radius: '12px' }),
  look({ bg: NQ.navy90, surface: NQ.navy80, surface2: NQ.grey70, sunken: NQ.navy, line: NQ.grey70, text: NQ.white, quiet: NQ.grey20, accent: NQ.gold400, onAccent: NQ.navy, bug: NQ.red700, idea: NQ.gold400, review: NQ.grey40, inkIdea: NQ.navy, inkReview: NQ.navy, radius: '6px' }),
  look({ bg: NQ.grey5, surface: NQ.white, surface2: NQ.grey10, line: NQ.grey20, text: NQ.navy, quiet: NQ.grey70, accent: NQ.navy80, onAccent: NQ.white, bug: '#9d0020', idea: NQ.orange, review: NQ.grey60, radius: '2px', pill: '4px' }),
  look({ bg: NQ.navy, surface: '#0d1030', surface2: NQ.navy90, sunken: '#02030f', line: NQ.navy90, text: NQ.gold100, quiet: NQ.grey40, accent: NQ.gold, onAccent: NQ.navy, bug: NQ.red, idea: NQ.gold, review: NQ.orange, inkIdea: NQ.navy, radius: '2px', pill: '2px' }),
  NIMIQ_MINE,
  look({ bg: NQ.wine, surface: '#9d0020', surface2: '#83001b', sunken: '#4d0015', line: '#b3203a', text: NQ.white, quiet: NQ.gold100, accent: NQ.gold, onAccent: NQ.navy, bug: NQ.red700, idea: NQ.gold, review: NQ.gold400, inkIdea: NQ.navy, inkReview: NQ.navy, radius: '14px' }),
  look({ bg: NQ.paper, surface: NQ.grey5, surface2: NQ.grey10, line: NQ.grey20, text: NQ.navy, quiet: NQ.grey60, accent: NQ.navy, onAccent: NQ.white, bug: NQ.navy, idea: NQ.grey60, review: NQ.grey40, done: NQ.navy, radius: '8px' }),
];
const NIMIQ_ROWS = {
  bright: [NQ.gold, NQ.red, NQ.red700, NQ.orange, NQ.navy, NQ.grey60],
  ground: [NQ.white, NQ.navy, NQ.navy90, NQ.paper, NQ.gold50, NQ.navy80],
};
/** The scene's colours in the look the site wears. */
const looks = () => (calm() ? NIMIQ_LOOKS : LOOKS);
const mineLook = () => (calm() ? NIMIQ_MINE : MINE_LOOK);
const rows = () => (calm() ? NIMIQ_ROWS : ROWS);

/**
 * A widget is coloured in a few taps: its ground, its tiles, its buttons and
 * shape. The first widget's round button, tiles and ground are picked from
 * a row of colours, as on Customize; the rest, and every copy, just tapped.
 */
const COPY_PARTS = [
  ['bg', 'sunken', 'sent', 'surface', 'surface2', 'line', 'text', 'quiet', 'sentTitle', 'sentNote'],
  ['bug', 'idea', 'review', 'tileBug', 'tileIdea', 'tileReview', 'inkBug', 'inkIdea', 'inkReview'],
  ['accent', 'fill', 'onAccent', 'raise', 'done', 'fab', 'onFab', 'radius', 'pill'],
].map((part) => part.map((k) => VAR[k]));
/** What the cursor colours big, in order, before the widget goes back: the round button, then each tile. */
const MINE_STEPS = [
  { part: 'fab', name: 'Button', row: 'bright', pick: 0, keys: [VAR.fab, VAR.onFab] },
  { part: 'bug', name: 'Bug', row: 'bright', pick: 1, keys: [VAR.bug, VAR.tileBug, VAR.inkBug] },
  { part: 'idea', name: 'Idea', row: 'bright', pick: 2, quick: true, keys: [VAR.idea, VAR.tileIdea, VAR.inkIdea] },
  { part: 'review', name: 'Review', row: 'bright', pick: 3, quick: true, keys: [VAR.review, VAR.tileReview, VAR.inkReview] },
];
const GROUND_STEP = { name: 'Background', row: 'ground', pick: 0, quick: true, keys: COPY_PARTS[0] };

/** Its board: that same bug, fixed now, and one of each kind, so every colour shows. */
const BUILD_SAMPLES = [
  { kind: 'bug', text: BUG, votes: 3, ago: 2 * 3_600_000, status: 'done', fix: VERSION, reply: REPLY },
  { kind: 'idea', text: 'A dark mode for the whole app', votes: 12, ago: 5 * 3_600_000 },
  { kind: 'review', text: 'Love how fast it is', rating: 5, votes: 4, ago: 26 * 3_600_000 },
  OTHER,
];

/** The widget's size in the middle, before it is scaled to the box. */
const BW = 300;
const BH = 440;

/** The cursor, as on Customize. */
const CURSOR =
  '<svg width="22" height="26" viewBox="0 0 22 26" aria-hidden="true"><path d="M2 2v19.5l5.2-4.9 3.6 7.9 3.6-1.6-3.5-7.7H18z" fill="#fff" stroke="#12132b" stroke-width="2" stroke-linejoin="round"/></svg>';

/** Where each widget on the stage stands: `{ x, y, r, s }` from the middle. */
const spots = new WeakMap();
/** How big the widget in the middle is drawn. */
let mainScale = 1;
/** Whether the end comes out of the round button, with a pop. */
let burst = false;
/** The build scene playing, so a clean-up planned for an older one leaves this one be. */
let buildRun = 0;

/** Put `vars` (or only those in `keys`) on a widget, or a copy of one. */
function paint(el, vars, keys = Object.keys(vars)) {
  for (const k of keys) el.style.setProperty(k, vars[k]);
}

/** A widget for the scene: inline, on `screenName`, nothing in it to tap. */
function sceneWidget(screenName) {
  const el = document.createElement('please-no-bugs');
  for (const [k, v] of Object.entries({ demo: '', mode: 'inline', theme: 'light', lang: 'en', screenshots: 'off', screen: screenName })) {
    el.setAttribute(k, v);
  }
  el.samples = BUILD_SAMPLES;
  el.inert = true;
  return el;
}

/**
 * The scene's stage, set under its title: the owner's board gone, the room
 * dimmed, and in the middle one real widget, inline, on its tiles, all grey.
 * The cursor, the line round a part, the row of colours and the big round
 * button of the end wait unseen. Two more widgets, out of sight, show the
 * board and "Feedback sent!" once, to be copied.
 */
function stage() {
  const glyph = box.querySelector('please-no-bugs')?.shadowRoot?.querySelector('.fab svg')?.outerHTML ?? '';
  for (const old of box.querySelectorAll('please-no-bugs')) old.remove();
  clearBuild();
  buildRun += 1;
  build.hidden = false;
  build.innerHTML =
    `<div class="tb-main"><span class="tb-fab">${glyph}</span></div>` +
    '<div class="tb-mark"><span></span></div>' +
    `<div class="tb-pick">${rows().bright.map(() => '<i></i>').join('')}<i class="tb-own"></i></div>` +
    `<span class="tb-cursor">${CURSOR}</span>` +
    `<span class="tb-button">${glyph}</span>` +
    '<div class="tb-bang"><i class="tb-wave"></i><i class="tb-wave tb-wave--2"></i></div>';
  const bang = build.querySelector('.tb-bang');
  const colours = calm()
    ? ['#ffb700', '#ffc758', '#e93700', '#ffd785', '#ffb700', '#cdcdd3']
    : ['#1fc7d4', '#8b5cf6', '#67e8f9', '#a78bfa', '#1fc7d4', '#c4b5fd'];
  for (let i = 0; i < 18; i++) {
    const spark = document.createElement('i');
    spark.className = 'tb-spark';
    spark.style.setProperty('--a', `${(i * 360) / 18 + Math.random() * 12}deg`);
    spark.style.setProperty('--d', `${110 + Math.random() * 170}px`);
    spark.style.setProperty('--c', colours[i % colours.length]);
    bang.append(spark);
  }
  const main = build.querySelector('.tb-main');
  const el = sceneWidget('tiles');
  paint(el, GREY);
  main.style.setProperty('--glow', 'rgba(125, 126, 149, 0.6)');
  main.prepend(el);
  paintFab(main, GREY);
  for (const screenName of ['board', 'sent']) {
    const away = sceneWidget(screenName);
    away.className = 'tb-away';
    build.append(away);
  }
  fitBuild();
}

/** The round button at the first widget's corner, in its button colours. */
function paintFab(main, vars) {
  const fab = main.querySelector('.tb-fab');
  fab.style.background = vars[VAR.fab];
  fab.style.color = vars[VAR.onFab];
}

/** The widget in the middle as big as fits the box, and the round button to match. */
function fitBuild() {
  const main = build.querySelector('.tb-main');
  if (!main) return;
  mainScale = Math.min(1, (box.clientWidth * 0.6) / BW, (box.clientHeight * 0.7) / BH);
  main.style.setProperty('--k', String(mainScale));
  build.style.setProperty('--btn', `${Math.round(Math.min(112, Math.max(72, Math.min(box.clientWidth, box.clientHeight) * 0.16)))}px`);
}

/** The stage cleared, at once. */
function clearBuild() {
  build.hidden = true;
  build.className = 'tour-build';
  build.replaceChildren();
}

/** A little bounce of `el`, as it takes a colour. */
function splat(el) {
  if (still.matches) return;
  el.animate([{ scale: '1' }, { scale: '1.06' }, { scale: '1' }], { duration: 320, easing: 'ease-out' });
}

/** Where `el` is on the stage, in the stage's own pixels. */
function onStage(el) {
  const b = build.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
}

/** A tap's ring on the stage at (x, y), small for a small widget. */
function tapRing(x, y, small = false) {
  const el = document.createElement('span');
  el.className = `tb-tap${small ? ' tb-tap--small' : ''}`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  build.append(el);
  setTimeout(() => el.remove(), 500);
}

/** Send a cursor to (x, y) on the stage, in `ms`. */
function moveCursor(cursor, x, y, ms) {
  cursor.style.transitionDuration = `${ms}ms`;
  cursor.style.transform = `translate(${x}px, ${y}px)`;
}

/** A tap where the cursor is: it dips, and a ring goes out. */
async function click(cursor, x, y, small = false) {
  tapRing(x, y, small);
  cursor.classList.add('down');
  await sleep(120);
  cursor.classList.remove('down');
}

/**
 * The line round a part, with its name, as on Customize, and its row of
 * colours under it, or over it where there is no room under it.
 */
function showPick(r, name, row) {
  const mark = build.querySelector('.tb-mark');
  const pick = build.querySelector('.tb-pick');
  const W = build.clientWidth;
  const H = build.clientHeight;
  const left = Math.max(2, r.x - 6);
  const top = Math.max(2, r.y - 6);
  const right = Math.min(W - 2, r.x + r.w + 6);
  const bottom = Math.min(H - 2, r.y + r.h + 6);
  Object.assign(mark.style, { left: `${left}px`, top: `${top}px`, width: `${right - left}px`, height: `${bottom - top}px` });
  mark.classList.toggle('tb-mark--in', bottom + 14 > H);
  mark.querySelector('span').textContent = name;
  mark.classList.add('on');
  [...pick.children].forEach((dot, i) => i < rows()[row].length && dot.style.setProperty('--c', rows()[row][i]));
  const pw = pick.offsetWidth;
  const ph = pick.offsetHeight;
  const below = r.y + r.h + 22;
  const y = below + ph < H - 8 ? below : Math.max(8, r.y - ph - 12);
  const x = Math.min(W - pw - 8, Math.max(8, r.x + r.w / 2 - pw / 2));
  Object.assign(pick.style, { left: `${x}px`, top: `${y}px` });
  pick.classList.add('on');
  return pick;
}

function hidePick() {
  build.querySelector('.tb-mark').classList.remove('on');
  const pick = build.querySelector('.tb-pick');
  pick.classList.remove('on');
  for (const dot of pick.children) dot.classList.remove('chosen');
}

/**
 * What the widget shows on a screen, kept to copy: its HTML, without its
 * styles, which the copies share as one sheet.
 */
const shots = {};
let sheet = null;
async function snap(el, screenName) {
  const ready = { tiles: '.tile--bug', board: '.card', sent: '.sent' }[screenName];
  await find(el, ready);
  await sleep(80);
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(el.shadowRoot.querySelector('style').textContent);
  }
  shots[screenName] = [...el.shadowRoot.children]
    .filter((n) => n.tagName !== 'STYLE')
    .map((n) => n.outerHTML)
    .join('');
}

/** A copy of the widget, on `screenName`, in `vars`: a picture of it, nothing in it alive. */
function copyOf(screenName, vars) {
  const c = document.createElement('div');
  c.className = 'tb-copy';
  const root = c.attachShadow({ mode: 'open' });
  root.adoptedStyleSheets = [sheet];
  root.innerHTML = shots[screenName];
  paint(c, vars);
  return c;
}

/**
 * Where the copies go: all around the middle, from close by to past the
 * edges, each a little turned and smaller, in a golden-angle spiral so none
 * lands on another, and none on `taken`, where the first widget went.
 */
function scatter(n, taken) {
  const hw = box.clientWidth / 2;
  const hh = box.clientHeight / 2;
  const clear = BW * taken.s * 0.75;
  return Array.from({ length: n }, (_, i) => {
    const a = i * 2.39996 + (Math.random() - 0.5) * 0.4;
    const f = 0.36 + 0.78 * Math.sqrt((i + 1) / n);
    return {
      x: Math.cos(a) * f * hw,
      y: Math.sin(a) * f * hh,
      r: (Math.random() - 0.5) * 26,
      s: mainScale * (0.3 + Math.random() * 0.16),
    };
  }).filter((p) => Math.hypot(p.x - taken.x, p.y - taken.y) > clear);
}

/** The transform of a widget at `p`, from the middle of the box. */
// Straight in the Nimiq look, which asks for calm: no tilted copies there.
const at = (p) => `translate(-50%, -50%) translate(${p.x}px, ${p.y}px) rotate(${calm() ? 0 : p.r}deg) scale(${p.s})`;

/**
 * The cursor colours one part of the first widget, as on Customize: to the
 * part, a tap, the line round it with its name and a row of colours, to the
 * colour, a tap, and the part takes it.
 */
async function colourIn(cursor, el, target, spot, step, r = onStage(target)) {
  const q = step.quick;
  moveCursor(cursor, spot.x, spot.y, q ? 320 : 460);
  await sleep(q ? 340 : 500);
  await click(cursor, spot.x, spot.y);
  const pick = showPick(r, step.name, step.row);
  await sleep(q ? 220 : 340);
  const dot = onStage(pick.children[step.pick]);
  moveCursor(cursor, dot.x + dot.w / 2, dot.y + dot.h / 2, q ? 260 : 360);
  await sleep(q ? 280 : 400);
  await click(cursor, dot.x + dot.w / 2, dot.y + dot.h / 2);
  pick.children[step.pick].classList.add('chosen');
  paint(el, mineLook(), step.keys);
  if (step.part === 'fab') paintFab(el.parentElement, mineLook());
  splat(target);
  await sleep(q ? 320 : 420);
  hidePick();
}

/**
 * A widget at `p` coloured in by `cursor` in a tap per part of `parts`,
 * each from `vars`; `pace` (1 down to about 0.3) how slowly.
 */
async function tapIn(cursor, el, p, vars, parts, pace, small) {
  const cx = build.clientWidth / 2 + p.x;
  const cy = build.clientHeight / 2 + p.y;
  const w = BW * p.s;
  const h = BH * p.s;
  // Low on it for its ground, the middle for its tiles, the top for the rest.
  const where = { [COPY_PARTS[0][0]]: [0.25, 0.38], [COPY_PARTS[1][0]]: [0, 0.05], [COPY_PARTS[2][0]]: [0.2, -0.3] };
  for (const part of parts) {
    const [fx, fy] = where[part[0]];
    const x = cx + fx * w + (Math.random() - 0.5) * w * 0.15;
    const y = cy + fy * h + (Math.random() - 0.5) * h * 0.1;
    moveCursor(cursor, x, y, 340 * pace);
    await sleep(370 * pace);
    await click(cursor, x, y, small);
    paint(el, vars, part);
    await sleep(160 * pace);
  }
}

/**
 * One copy, grey, popped up at `p`, and a cursor of its own that colours it
 * in three taps from `vars`. Its cursor goes once it is done.
 */
async function buildCopy(screenName, vars, p, pace) {
  const c = copyOf(screenName, GREY);
  spots.set(c, p);
  c.style.transform = at(p);
  build.insertBefore(c, build.querySelector('.tb-main'));
  if (!still.matches) {
    c.animate([{ transform: `${at(p)} scale(0.6)`, opacity: 0 }, { transform: at(p), opacity: 1 }], { duration: 320, easing: 'cubic-bezier(0.2, 1.25, 0.4, 1)' });
  }
  const cursor = document.createElement('span');
  cursor.className = 'tb-cursor tb-cursor--small';
  cursor.innerHTML = CURSOR;
  // In from outside the copy, away from the middle.
  const out = Math.hypot(p.x, p.y) || 1;
  moveCursor(cursor, build.clientWidth / 2 + p.x + (p.x / out) * BW * p.s * 0.7, build.clientHeight / 2 + p.y + (p.y / out) * BH * p.s * 0.5, 0);
  build.append(cursor);
  await sleep(40);
  cursor.classList.add('on');
  await tapIn(cursor, c, p, vars, COPY_PARTS, pace, true);
  cursor.classList.remove('on');
  await sleep(260);
  cursor.remove();
}

/** Grey copies all around, each coloured in by a cursor of its own, more and more, faster and faster. */
async function crowd(places) {
  const screens = ['tiles', 'board', 'sent'];
  const jobs = [];
  let gap = 260;
  for (const [i, p] of places.entries()) {
    const pace = Math.max(0.32, 0.65 - (0.4 * i) / places.length);
    jobs.push(buildCopy(screens[i % 3], looks()[(i + 1) % looks().length], p, pace).catch(() => {}));
    await sleep(gap);
    gap = Math.max(35, gap * 0.84);
  }
  await Promise.all(jobs);
}

/**
 * All of them into one round button in the middle: it pops up, each widget
 * flies to it in a curve, shrinking, as it gulps, then it squashes,
 * stretches, and pops.
 */
async function intoButton(main) {
  build.classList.add('tour-build--button');
  await sleep(420);
  build.classList.add('tour-build--eat');
  const all = [...build.querySelectorAll('.tb-copy'), main];
  const far = Math.max(...all.map((c) => Math.hypot(spots.get(c).x, spots.get(c).y)), 1);
  let longest = 0;
  for (const c of all) {
    const p = spots.get(c);
    const d = Math.hypot(p.x, p.y);
    const delay = (d / far) * 520 + Math.random() * 160;
    const duration = 520 + Math.random() * 160;
    longest = Math.max(longest, delay + duration);
    // A curve: halfway, off to the side a little.
    const bend = (Math.random() < 0.5 ? -1 : 1) * d * 0.22;
    const mid = { x: p.x * 0.45 - (p.y / (d || 1)) * bend, y: p.y * 0.45 + (p.x / (d || 1)) * bend, r: p.r * 0.4, s: p.s * 0.45 };
    c.animate(
      [
        { transform: at(p), opacity: 1 },
        { transform: at(mid), opacity: 1, offset: 0.55 },
        { transform: at({ x: 0, y: 0, r: 0, s: 0.02 }), opacity: 0.2 },
      ],
      { duration, delay, easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)', fill: 'forwards' },
    );
  }
  await sleep(longest + 60);
  build.classList.remove('tour-build--eat');
  build.classList.add('tour-build--pop');
  await sleep(420);
  build.classList.add('tour-build--bang');
  await sleep(60);
  burst = true;
}

/**
 * "Build your own widget.": a cursor colours the grey widget's button and tiles in,
 * the widget goes back among the others as it colours the rest, and
 * cursors everywhere colour in copies of their own; then all into one
 * round button, and out of it the end.
 */
async function buildRound() {
  const run = buildRun;
  const main = build.querySelector('.tb-main');
  const el = main.querySelector('please-no-bugs');
  const cursor = build.querySelector('.tb-cursor');
  // The board and "Feedback sent!" kept for the copies, then gone.
  await snap(el, 'tiles');
  for (const away of build.querySelectorAll('.tb-away')) {
    await snap(away, away.getAttribute('screen'));
    away.remove();
  }

  // Big in the middle: the round button, then each tile, each picked from a
  // row of colours.
  moveCursor(cursor, build.clientWidth * 0.78, build.clientHeight * 0.42, 0);
  await sleep(40);
  cursor.classList.add('on');
  say(BUILD, 1).catch(() => {});
  for (const step of MINE_STEPS) {
    const target = step.part === 'fab' ? main.querySelector('.tb-fab') : await find(el, `.tile--${step.part}`);
    const t = onStage(target);
    await colourIn(cursor, el, target, { x: t.x + t.w / 2, y: t.y + t.h / 2 }, step);
  }

  // Only then back among the others, at the top left, smaller; once it is
  // there, the others' cursors come.
  const home = { x: -box.clientWidth * 0.2, y: -box.clientHeight * 0.17, r: -5, s: mainScale * 0.56 };
  spots.set(main, home);
  main.style.transition = still.matches ? 'none' : 'transform 650ms cubic-bezier(0.3, 0.9, 0.3, 1)';
  main.style.transform = at(home);
  main.classList.add('is-back');
  await sleep(680);
  say(BUILD, 2).catch(() => {});
  const others = crowd(scatter(box.clientWidth < 640 ? 18 : 30, home));
  // Its ground, picked from a row, quicker now; then the rest, just tapped.
  // Where it went worked out, not measured: it may still be on its way.
  const w = BW * home.s;
  const h = BH * home.s;
  const r = { x: build.clientWidth / 2 + home.x - w / 2, y: build.clientHeight / 2 + home.y - h / 2, w, h };
  await colourIn(cursor, el, el, { x: r.x + r.w * 0.2, y: r.y + r.h - 18 * home.s }, GROUND_STEP, r);
  await tapIn(cursor, el, home, mineLook(), COPY_PARTS.slice(2), 0.55, false);
  cursor.classList.remove('on');
  await others;
  if (run !== buildRun) return;
  await sleep(250);

  // Without movement, no round button: the end comes as it always did.
  if (still.matches) return;
  subtitle.classList.add('tour-say--away');
  await intoButton(main);
}

// ---- Playing, pausing, stopping -----------------------------------------

/** The tour that is playing, so a new one starts only once it is out. */
let last = Promise.resolve();

/** Whether `el` is in the box, or in the widget there. */
function inFrame(el) {
  for (let node = el; node; ) {
    if (frame.contains(node)) return true;
    const root = node.getRootNode();
    node = root instanceof ShadowRoot ? root.host : null;
  }
  return false;
}

/** The pretend app for the tour, or the heading back. */
function app(on) {
  frame.classList.toggle('tour--app', on);
  page.inert = on;
  if (on) subtitle.focus({ preventScroll: true });
  else if (!document.activeElement || document.activeElement === document.body || frame.contains(document.activeElement)) {
    // Back where the visitor came from, unless they went elsewhere meanwhile.
    watch.focus({ preventScroll: true });
  }
}

/** Back to the heading and "Watch demo", with a fresh widget, closed. */
function rest() {
  frame.classList.remove('tour--playing', 'tour--end');
  endCard.hidden = true;
  endIntro();
  clearBuild();
  app(false);
  mount('user');
}

/** Play the story, once, then rest. */
async function play(from = 0) {
  const mine = ++current;
  await last;
  if (mine !== current) return;
  running = mine;
  burst = false;
  clearBuild();
  endCard.hidden = true;
  frame.classList.remove('tour--end');
  subtitle.querySelector('.tour-say__title').textContent = '';
  subtitle.classList.add('tour-say--away');
  frame.classList.add('tour--playing');
  app(true);
  last = story(from)
    .catch((e) => {
      // A step that did not find its button ends the tour rather than hang it.
      if (e !== STOP) console.warn(e);
    })
    .then(() => {
      if (mine === current) end();
    });
}

/**
 * The end, over the app as the story left it: the whole story in three
 * steps, and where to go next. It stays until the visitor picks, or Esc.
 * Out of the round button it bursts as the button pops, and
 * the stage goes; otherwise the stage goes at once.
 */
function end() {
  frame.classList.remove('tour--playing');
  frame.classList.add('tour--end');
  endIntro();
  endCard.classList.toggle('tour-end--burst', burst);
  if (burst) {
    const run = buildRun;
    setTimeout(() => {
      if (run === buildRun && !frame.classList.contains('tour--playing')) clearBuild();
    }, 1400);
  } else {
    clearBuild();
  }
  burst = false;
  endCard.hidden = false;
  again.focus({ preventScroll: true });
}

/** Stop wherever it is: the tour ends at its next step. */
function stop() {
  current += 1;
  rest();
}

/**
 * Back to the start of the part before this one (`by` -1), or on to the next
 * (1). Back from the first starts it over; on from the last ends the tour.
 */
function jump(by) {
  if (!frame.classList.contains('tour--playing')) return;
  const to = Math.max(0, chapter + by);
  if (to > (calm() ? ownerPart() : buildPart())) {
    // The story stops where it is, and its end comes over it.
    current += 1;
    return end();
  }
  chapter = to;
  void play(to);
}

/** Where on the box a click lands: its left third goes back, its right third on, the middle nowhere (0). */
function side(e) {
  const r = box.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  return x < 1 / 3 ? -1 : x > 2 / 3 ? 1 : 0;
}

if (box && frame && page && subtitle && watch && titleCard && endCard && again && intro && caption && skip && said && build) {
  await customElements.whenDefined('please-no-bugs');
  mount('user');
  watchSight();
  // The other look: the widget in or out of the Nimiq look's app window.
  document.addEventListener('pnb:style', () => {
    const el = box.querySelector('please-no-bugs');
    if (el) fit(el);
  });
  // The drawing's lines and round button follow the box as it changes size.
  new ResizeObserver(() => {
    if (!build.hidden) fitBuild();
    const n = Number(frame.dataset.intro ?? 0);
    if (!n) return;
    if (n >= 5) drawFab();
    if (n >= 6) placeBoard();
    placeLines();
  }).observe(box);

  watch.addEventListener('click', (e) => {
    // Not also a click on the box, which would skip what just started.
    e.stopPropagation();
    void play();
  });
  // The Nimiq look's hero, above the box: its "Watch demo" brings the box
  // into view and plays it there.
  for (const btn of document.querySelectorAll('[data-nq-watch]')) {
    btn.addEventListener('click', () => {
      frame.scrollIntoView({ behavior: still.matches ? 'auto' : 'smooth', block: 'center' });
      void play();
    });
  }
  skip.addEventListener('click', (e) => {
    // Not a skip either.
    e.stopPropagation();
    skipped = true;
    skip.hidden = true;
    subtitle.focus({ preventScroll: true });
  });
  // While it plays, a visitor's click on the box's left third goes a part
  // back, on its right third a part on; the middle does nothing. Nothing
  // shows the thirds but the cursor over them. Not the tour's own taps,
  // which bubble up here too.
  frame.addEventListener('click', (e) => {
    if (!e.isTrusted || !frame.classList.contains('tour--playing')) return;
    const by = side(e);
    if (by) jump(by);
  });
  frame.addEventListener('mousemove', (e) => {
    const by = frame.classList.contains('tour--playing') ? side(e) : 0;
    frame.classList.toggle('tour--at-back', by < 0);
    frame.classList.toggle('tour--at-next', by > 0);
  });
  frame.addEventListener('mouseleave', () => frame.classList.remove('tour--at-back', 'tour--at-next'));
  // And with the arrow keys, while it plays, unless they are typing
  // somewhere; Esc stops it.
  again.addEventListener('click', (e) => {
    e.stopPropagation();
    void play();
  });
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    // At the end, Esc goes back to the heading.
    if (e.key === 'Escape' && !endCard.hidden) {
      e.preventDefault();
      return rest();
    }
    if (!frame.classList.contains('tour--playing')) return;
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      jump(e.key === 'ArrowLeft' ? -1 : 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      stop();
    }
  });
}
