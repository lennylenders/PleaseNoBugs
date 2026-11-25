/**
 * The home page's demo: one story, told on a light stage with a white "Your
 * app" window at its right and the step's big line at its left.
 *
 * It starts with why PleaseNoBugs is there, in six short scenes drawn around
 * the app window (`INTRO`; the drawing is site.css's): imagine this is your
 * app, its first users, what each says, scattered, most of them leaving
 * without a word, a round button, and all that feedback on one board
 * everyone can see, with a thin dashed line from each user to it. Each
 * scene's words fade in whole, which scene of how many small above them.
 * "Skip intro" goes straight on. Until then the app shows no round button.
 *
 * Then, over the dimmed app under a small "How it works", a title says whose
 * side comes next:
 *
 * - **Your user's perspective**: tap the round button, pick Report a bug on
 *   the tiles, describe it, send it, and only then the board, with their bug
 *   on it and one other.
 * - **Your perspective**, the owner's (`demo="owner"`): the round button,
 *   the board, that same bug picked, marked fixed in a version with a link,
 *   answered, and the card as everybody now sees it.
 * - An end that stays: the whole story in three steps ("Your users speak.
 *   You fix. Everyone sees."), with "Make it yours" and "Watch again".
 *
 * Both boards hold only that bug and one other (`samples`), so the story is
 * all there is to look at. The owner's is a widget of its own, with the
 * user's bug already on it, as the user sent it.
 *
 * A subtitle says what each step is (`USER`, `OWNER`), which step of how
 * many above it, and a ring shows each tap. It does not pause: a click on
 * the stage's left third goes back to the start of the part before (an
 * intro scene, the user's side, the owner's), on its right third on to the
 * next, and its middle does nothing; so do the arrow keys, and Esc stops it.
 * Nothing shows this but the cursor.
 *
 * The widget is `inert`: a visitor watches, nothing in it takes a tap. The
 * taps here are the widget's own buttons, clicked from this script, so what
 * plays is what the widget really does. A fresh widget every time, so the
 * demo board starts over too: its posts live only in the page's memory and
 * nothing leaves the browser. It waits while the stage is off screen or the
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
const still = window.matchMedia('(prefers-reduced-motion: reduce)');

const said = document.getElementById('ti-said');

/**
 * The intro's scenes: the big line, the small one under it, and how long the
 * drawing plays on once the words are there (ms, as drawn in site.css).
 */
const INTRO = [
  { title: 'Imagine this is your app.', line: '', ms: 2400 },
  { title: 'Your first users arrive.', line: '', ms: 1600 },
  { title: 'They give feedback, all over the place.', line: 'In reviews, chats and DMs.', ms: 1600 },
  { title: 'And then most of your users leave, and never tell you why.', line: "Most apps don't die loudly.", ms: 2240 },
  { title: 'PleaseNoBugs gives it one place.', line: 'An open-source feedback button in your app.', ms: 2400 },
  { title: 'All your feedback in one place.', line: 'Visible to all your users.', ms: 2880 },
];

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

/** Who the user in the tour is, typed into the name field. */
const WHO = 'Mila';

/**
 * One story on a quiet board: the bug the user sends, and one other bug of
 * somebody else's, still open. The user's board starts with that other bug
 * alone; the owner's has the user's bug too, as the user sent it: with their
 * name, and (`mine`) the same identicon the user had.
 */
const OTHER = { kind: 'bug', text: 'The send button does nothing after I switch accounts', votes: 4, ago: 20 * 3_600_000, who: 'Sam' };
const SAMPLES = {
  user: [OTHER],
  owner: [{ kind: 'bug', text: BUG, votes: 1, ago: 3_600_000, who: WHO, mine: true }, OTHER],
};

/** The same settings as Make it yours' widgets, and no screenshots: the demo never adds one. */
function widget(pov) {
  const el = document.createElement('please-no-bugs');
  for (const [k, v] of Object.entries({
    demo: pov === 'owner' ? 'owner' : '',
    mode: 'floating',
    theme: 'nimiq',
    screenshots: 'off',
    // Only for the identicons: the tour's posts stay in the page (demo.ts).
    server: '%BOARD_SERVER%',
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
  // The app is a window on the stage, at its right: the round button, the
  // panel and what dims behind it stay inside that window.
  const a = box.querySelector('.tour-app');
  const w = { t: a.offsetTop, l: a.offsetLeft, r: box.clientWidth - a.offsetLeft - a.offsetWidth, b: box.clientHeight - a.offsetTop - a.offsetHeight };
  const h = box.clientHeight - 48 - w.t - w.b;
  const inset =
    ` .fab { right: ${16 + w.r}px; bottom: ${16 + w.b}px; }` +
    ` .overlay { inset: ${w.t}px ${w.r}px ${w.b}px ${w.l}px; border-radius: 14px; overflow: hidden; }` +
    ` @media (min-width: 640px) { .overlay { inset: auto ${24 + w.r}px ${24 + w.b}px auto; }` +
    ` .backdrop { inset: ${w.t}px ${w.r}px ${w.b}px ${w.l}px; border-radius: 14px; } }`;
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
const PACE = 1.125;

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
 * first and the new one fading in whole, which step of how many small above
 * it; the step waits a moment to read it.
 */
async function say(steps, n) {
  const text = steps[n - 1];
  const shown = subtitle.querySelector('.tour-say__title');
  subtitle.classList.add('tour-say--away');
  await sleep(180);
  shown.textContent = '';
  subtitle.querySelector('[role="status"]').textContent = text;
  subtitle.dataset.step = `${String(n).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
  shown.textContent = text;
  subtitle.classList.remove('tour-say--away');
  await sleep(700);
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

/**
 * Scene 5's round button: drawn where the real one sits, with its colours
 * and icon, as the real one stays hidden until the intro is over.
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

/**
 * Scene 6's lines (site.css draws them, dashed): from each user to the
 * board, as if all of them look at the one place now. Made once, then only
 * moved, so a line being drawn goes on.
 */
function placeLines() {
  const svg = intro.querySelector('.nq-lines');
  if (!svg) return;
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
  if (n === 5) drawFab();
  if (n === 6) placeBoard();
  placeLines();
  frame.dataset.intro = String(n);
  // The round button, tapped: the board opens from it.
  if (n === 6) ring(intro.querySelector('.ti-fab'));
}

/**
 * Scene `n` (from 1): the old words out; the big line fades in whole as
 * its drawing starts (the words in first, so the drawing can keep clear of
 * them), the small one after it, and a moment to read them.
 */
async function scene(n) {
  const { title: big, line } = INTRO[n - 1];
  caption.dataset.step = `${String(n).padStart(2, '0')} / ${String(INTRO.length).padStart(2, '0')}`;
  caption.classList.add('ti-caption--away');
  await hold(450);
  if (skipped) return;
  caption.querySelector('b').textContent = big;
  caption.querySelector('span').textContent = line;
  draw(n);
  caption.classList.remove('ti-caption--away', 'ti-caption--line');
  // Said whole for a screen reader.
  said.textContent = line ? `${big} ${line}` : big;
  await hold(700);
  caption.classList.add('ti-caption--line');
  await hold(Math.min(1400, big.length * 22));
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
  for (let n = from; n <= INTRO.length && !skipped; n++) {
    chapter = n - 1;
    await scene(n);
    await hold(INTRO[n - 1].ms);
  }
}

/** The intro drawn as scene `n` (from 1) left it, at once: for starting at the scene after it. */
function settle(n) {
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
  caption.classList.remove('ti-caption--line');
  said.textContent = '';
  if (hadFocus && frame.classList.contains('tour--playing')) subtitle.focus({ preventScroll: true });
}

/** The whole story: why, then the user sends a bug, and the owner fixes it. */
async function story(from = 0) {
  if (from < INTRO.length) await playIntro(from + 1);
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
}

/**
 * The story's parts, to go back or on by: the intro's scenes (0 to 5), the
 * user's side and the owner's. On from that is the end.
 */
const userPart = () => INTRO.length;
const ownerPart = () => INTRO.length + 1;
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
  await wait(600);
  // Named, as every post is unless its author picks anonymous: the name goes
  // out with their wallet's identicon.
  const name = await find(el, '.name-field input');
  await reveal(name);
  await type(name, WHO);
  await wait(700);
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
  app(false);
  mount('user');
}

/** Play the story, once, then rest. */
async function play(from = 0) {
  const mine = ++current;
  await last;
  if (mine !== current) return;
  running = mine;
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
 */
function end() {
  frame.classList.remove('tour--playing');
  frame.classList.add('tour--end');
  endIntro();
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
  if (to > ownerPart()) {
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

if (box && frame && page && subtitle && watch && titleCard && endCard && again && intro && caption && skip && said) {
  await customElements.whenDefined('please-no-bugs');
  mount('user');
  watchSight();
  // While it plays, the page's own round button (the real board, bottom
  // right) steps aside: two of the same button, one pretend, is one too many.
  // Back as soon as the story stops or ends (site.css, `.tour-on`).
  new MutationObserver(() => document.body.classList.toggle('tour-on', frame.classList.contains('tour--playing'))).observe(frame, {
    attributes: true,
    attributeFilter: ['class'],
  });
  // The drawing's lines and round button follow the box as it changes size.
  new ResizeObserver(() => {
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
  // The hero's "Watch demo", above the stage: brings the stage into view and
  // plays it there.
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
