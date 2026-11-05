/**
 * The home page's tour. The page is a pretend app: the heading, its line
 * and "Watch demo", and the real widget's round button in its corner, in
 * `demo` mode. "Watch demo" turns the page into the configurator's pretend
 * app ("Your app" and its skeleton) and plays one story through, once,
 * then the heading is back.
 *
 * It starts with why PleaseNoBugs is there, in four short scenes drawn on
 * the pretend app (`INTRO`; the drawing is site.css's), each with its big
 * line typed out first: imagine this is your app, users leave without a
 * word, what feedback there is is scattered, and the answer, a round button
 * and one board everyone can see. "Skip intro" goes straight on. Then, big over the
 * dimmed app under a small "How it works", a title says whose side comes
 * next:
 *
 * - **User perspective**, as a user meets it: tap the round button, pick
 *   Report a bug on the tiles, describe it, send it, and only then the
 *   board, with their bug on it and one other.
 * - **App owner perspective** (`demo="owner"`): the round button, the
 *   board, that same bug picked, marked fixed in a version with a link,
 *   answered, and the card as everybody now sees it.
 * - **Fixed!** to end it.
 *
 * Both boards hold only that bug and one other (`samples`), so the story is
 * all there is to look at. The owner's is a widget of its own, with the
 * user's bug already on it, as the user sent it.
 *
 * A subtitle says what each step is (`USER`, `OWNER`), a ring shows each
 * tap, as in the configurator's step 1. A click on the box pauses it, a
 * second goes on; paused, it can be stopped.
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
const pausedNote = document.getElementById('tour-paused');
const watch = document.getElementById('tour-watch');
const titleCard = document.getElementById('tour-title');
const intro = document.getElementById('tour-intro');
const caption = intro?.querySelector('.ti-caption');
const skip = document.getElementById('tour-skip');
const still = window.matchMedia('(prefers-reduced-motion: reduce)');

const said = document.getElementById('ti-said');

/**
 * The intro's scenes: the big line, typed out; the small one under it; and
 * how long the drawing then plays (ms, as drawn in site.css).
 */
const INTRO = [
  { title: 'Imagine this is your app.', line: '', ms: 2800 },
  { title: 'Your users just leave, and never tell you why.', line: "Most apps don't die loudly.", ms: 4600 },
  { title: 'The feedback you do get is scattered.', line: 'Buried in reviews, chats and DMs.', ms: 3400 },
  {
    title: 'This open source feedback widget is the solution!',
    line: 'PleaseNoBugs: one button in your app, one board everyone can see.',
    ms: 5200,
  },
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
  'Sees it on the board',
];
const OWNER = ['You open your board', 'Pick the bug', 'Mark it fixed', 'Answer the user', 'See it on the board'];

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
    theme: 'pleasenobugs',
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
 * like it, and in a tour it is one thing too many.
 */
function fit(el) {
  let style = el.shadowRoot.querySelector('style[data-site]');
  if (!style) {
    style = document.createElement('style');
    style.dataset.site = '';
    el.shadowRoot.append(style);
  }
  const h = box.clientHeight - 48;
  // With the owner's sheet open over the board, as tall as the box allows,
  // so the sheet is not squeezed out of view by a short board.
  style.textContent =
    `@media (min-width: 640px) { .overlay, .overlay .app { max-height: ${h}px; }` +
    ` .overlay .app:has(.filters):has(.scrim) { height: ${h}px; } }` +
    ` .alike { display: none !important; }`;
}

/** A fresh widget in the box, the old one and any ring gone. */
function mount(pov) {
  for (const old of box.querySelectorAll('please-no-bugs, .tour-tap')) old.remove();
  const el = widget(pov);
  box.append(el);
  fit(el);
  return el;
}

// ---- Time: it only runs while it plays, unpaused, where it can be seen ----

/** Thrown out of a tour that was stopped. */
const STOP = Symbol('stop');
/** Which tour is current, and which is running: one that is not current stops at its next pause. */
let current = 0;
let running = 0;
let paused = false;
let seen = true;

/** How much longer every pause is than the numbers below say: time to take each step in. */
const PACE = 1.5;

/**
 * `ms` of the tour's own time, counted in short steps: none passes while it
 * is paused or out of sight, and a stop ends it within a step.
 */
async function sleep(ms) {
  let left = ms;
  while (left > 0) {
    const step = Math.min(left, 50);
    await new Promise((r) => setTimeout(r, step));
    if (running !== current) throw STOP;
    if (!paused && seen) left -= step;
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

/** Show a tap on `target`, then tap it. */
async function tap(target) {
  ring(target);
  await sleep(160);
  target.click();
}

/** Scroll the panel, or the sheet over it, just enough to show `target`, so a tap on it is seen. */
async function reveal(target) {
  const list = target.closest('.sheet, .scroll');
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

/** Put step `n` (from 1) of `steps` in the subtitle, the old one fading out first. */
async function say(steps, n) {
  subtitle.classList.add('tour-say--away');
  await sleep(180);
  subtitle.querySelector('.tour-say__title').textContent = steps[n - 1];
  subtitle.classList.remove('tour-say--away');
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
    if (!paused && seen) left -= 50;
  }
}

/**
 * Scene 4's round button: drawn where the real one sits, with its colours
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
 * Scene `n` (from 1): the old words out, the big line typed, the small one
 * after it, and then its drawing.
 */
async function scene(n) {
  const { title: big, line } = INTRO[n - 1];
  caption.classList.add('ti-caption--away');
  await hold(250);
  if (skipped) return;
  const bigEl = caption.querySelector('b');
  bigEl.textContent = '';
  caption.querySelector('span').textContent = line;
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
  if (n === 4) drawFab();
  frame.dataset.intro = String(n);
}

/** Why PleaseNoBugs is there, in four scenes, unless skipped. */
async function playIntro() {
  skipped = false;
  // No widget or subtitle from the start; the drawing waits for scene 1.
  frame.dataset.intro = '0';
  intro.hidden = false;
  skip.hidden = false;
  skip.focus({ preventScroll: true });
  for (let n = 1; n <= INTRO.length && !skipped; n++) {
    await scene(n);
    await hold(INTRO[n - 1].ms);
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
async function story() {
  await playIntro();
  await title('User perspective', 'How it works', endIntro);
  await userRound();
  await title('App owner perspective', 'How it works');
  await ownerRound();
  await title('Fixed!');
}

/** The app user's side. */
async function userRound() {
  const el = mount('user');

  await say(USER, 1);
  await wait(2200);
  await tap(await find(el, '.fab'));

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

  await say(OWNER, 1);
  await wait(2000);
  await tap(await find(el, '.fab'));
  await find(el, '.list');
  await wait(1600);

  // The user's bug: a tap on a card is the owner's way in.
  const bug = await find(el, card(BUG));
  await say(OWNER, 2);
  await reveal(bug);
  await wait(1400);
  await tap(bug);

  // Done, with the version it is fixed in and the pull request.
  const done = await find(el, button('.sheet .states .chip-pick', 'Done'));
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
  const reply = await find(el, '.sheet textarea.field');
  await say(OWNER, 4);
  await reveal(reply);
  await wait(600);
  await type(reply, REPLY);
  await wait(800);
  const save = await find(el, '.sheet__actions .btn:not([disabled])');
  await reveal(save);
  await tap(save);

  // The card, as everybody sees it now.
  const fixed = await find(el, (root) => !root.querySelector('.sheet') && card(BUG)(root)?.querySelector('.fix') && card(BUG)(root));
  await say(OWNER, 5);
  await reveal(fixed);
  await wait(3000);
  // "Fixed!" comes over the board, the fixed card still under it.
}

// ---- Playing, pausing, stopping -----------------------------------------

/** The tour that is playing, so a new one starts only once it is out. */
let last = Promise.resolve();

/** Pause or go on. */
function pause(on) {
  paused = on;
  pausedNote.hidden = !on;
  subtitle.querySelector('.tour-say__hint').textContent = on ? 'Click to continue' : 'Click to pause';
  frame.classList.toggle('tour--paused', on);
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
  pause(false);
  frame.classList.remove('tour--playing');
  endIntro();
  app(false);
  mount('user');
}

/** Play the story, once, then rest. */
async function play() {
  const mine = ++current;
  await last;
  if (mine !== current) return;
  running = mine;
  pause(false);
  subtitle.querySelector('.tour-say__title').textContent = '';
  frame.classList.add('tour--playing');
  app(true);
  last = story()
    .catch((e) => {
      // A step that did not find its button ends the tour rather than hang it.
      if (e !== STOP) console.warn(e);
    })
    .then(() => {
      if (mine === current) rest();
    });
}

/** Stop wherever it is: the tour ends at its next step. */
function stop() {
  current += 1;
  rest();
}

if (box && frame && page && subtitle && pausedNote && watch && titleCard && intro && caption && skip && said) {
  await customElements.whenDefined('please-no-bugs');
  mount('user');
  watchSight();

  watch.addEventListener('click', (e) => {
    // Not also a click on the box, which would pause what just started.
    e.stopPropagation();
    void play();
  });
  skip.addEventListener('click', (e) => {
    // Not a pause either.
    e.stopPropagation();
    skipped = true;
    skip.hidden = true;
    subtitle.focus({ preventScroll: true });
    if (paused) pause(false);
  });
  document.getElementById('tour-stop')?.addEventListener('click', (e) => {
    e.stopPropagation();
    stop();
  });
  // While it plays, a visitor's click anywhere on the box, the subtitle with
  // it, pauses or goes on. Not the tour's own taps, which bubble up here too.
  frame.addEventListener('click', (e) => {
    if (e.isTrusted && frame.classList.contains('tour--playing')) pause(!paused);
  });
}
