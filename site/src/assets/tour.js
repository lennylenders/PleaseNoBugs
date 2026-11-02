/**
 * The home page's tour. The page is a pretend app: the heading, its line
 * and "Watch demo", and the real widget's round button in its corner, in
 * `demo` mode. "Watch demo" turns the page into the configurator's pretend
 * app ("Your app" and its skeleton) with a choice of side in its middle;
 * the side picked plays through on its own, once, then the heading is back:
 *
 * - **App user**, as a user meets it: tap the round button, pick Report a
 *   bug on the tiles, describe it, send it, and only then the board, with
 *   everybody else's feedback and the app's answers, where an idea gets a
 *   vote.
 * - **App owner** (`demo="owner"`): the board, a bug picked, marked fixed in
 *   a version with a link, answered, the card as everybody now sees it, and
 *   an update telling everyone what changed.
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
const pick = document.getElementById('tour-pick');
const still = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * The subtitles, one per step: about your user on one side, about you on
 * the other. Only the first says who; the rest go on from it.
 */
const USER = [
  'Your user taps the button',
  'Picks what it is',
  'Describes the bug',
  'Sends it',
  'Sees everyone’s feedback',
  'Votes for an idea',
];
const OWNER = ['You open your board', 'Pick a bug', 'Mark it fixed', 'Answer the user', 'See it on the board', 'Post an update'];

/** What the tour writes, typed out a letter at a time. */
const BUG = 'The save button does nothing on my phone';
/** The owner's: a sample bug of Sam's, fixed. */
const SAMS_BUG = 'Amounts over 1,000';
const VERSION = '1.4.3';
const PULL = 'github.com/you/app/pull/42';
const REPLY = 'Thanks Sam! Fixed, it is in the next version.';
const UPDATE = 'Amounts fit on small phones';
const RELEASE = 'github.com/you/app/releases';

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
  style.textContent = `@media (min-width: 640px) { .overlay, .overlay .app { max-height: ${h}px; } } .alike { display: none !important; }`;
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

/** Show a tap on `target`, then tap it. */
async function tap(target) {
  const b = box.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const ring = document.createElement('span');
  ring.className = 'tour-tap';
  ring.style.left = `${t.left + t.width / 2 - b.left}px`;
  ring.style.top = `${t.top + t.height / 2 - b.top}px`;
  box.append(ring);
  // The next frame, so the ring starts from its resting state.
  requestAnimationFrame(() => ring.classList.add('tour-tap--on'));
  setTimeout(() => ring.remove(), 600);
  await sleep(160);
  target.click();
}

/** Scroll the panel's list by `by` pixels, smoothly, and let it settle. */
async function scroll(el, by) {
  const list = el.shadowRoot.querySelector('.scroll');
  list?.scrollBy({ top: by, behavior: still.matches ? 'auto' : 'smooth' });
  await wait(900);
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

  // Only now the board: everybody else's feedback and the app's answers.
  // The widget goes there by itself after "Feedback sent!", as in an app.
  await find(el, '.list', 100);
  await wait(600);
  await say(USER, 5);
  await wait(2200);
  await scroll(el, 280);
  await wait(1200);
  await scroll(el, 280);
  await wait(1200);
  await scroll(el, -560);

  // An idea somebody else had: one more vote.
  const vote = await find(el, (root) =>
    [...root.querySelectorAll('.card')]
      .find((c) => c.querySelector('.badge__dot--idea') && c.querySelector('.vote[aria-pressed="false"]'))
      ?.querySelector('.vote'),
  );
  await say(USER, 6);
  await reveal(vote);
  await wait(1400);
  await tap(vote);
  await wait(2400);

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

  // Sam's bug: a tap on a card is the owner's way in.
  const sams = await find(el, card(SAMS_BUG));
  await say(OWNER, 2);
  await reveal(sams);
  await wait(1400);
  await tap(sams);

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
  const fixed = await find(el, (root) => !root.querySelector('.sheet') && card(SAMS_BUG)(root)?.querySelector('.fix') && card(SAMS_BUG)(root));
  await say(OWNER, 5);
  await reveal(fixed);
  await wait(3000);

  // And an update, for everyone who did not report it.
  await say(OWNER, 6);
  await tap(await find(el, barButton('Updates')));
  await wait(1400);
  await tap(await find(el, barButton('New update')));
  const title = await find(el, '#pnb-update-title');
  await wait(800);
  await type(title, UPDATE);
  await wait(300);
  await type(await find(el, '#pnb-update-version'), VERSION);
  await wait(300);
  await type(await find(el, '#pnb-update-link'), RELEASE);
  await wait(700);
  const publish = await find(el, '.send .btn:not([disabled])');
  await reveal(publish);
  await tap(publish);
  await find(el, (root) => root.querySelector('.update__title')?.textContent === UPDATE);
  await wait(2800);

  await tap(await find(el, barButton('Back')));
  await wait(900);
  await tap(await find(el, barButton('Close')));
  await wait(900);
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

/** The pretend app with the choice of side in it, or the heading back. */
function choose(on) {
  frame.classList.toggle('tour--app', on);
  page.inert = on;
  pick.hidden = !on;
  if (on) pick.querySelector('[data-pov]').focus({ preventScroll: true });
  else if (!document.activeElement || document.activeElement === document.body || frame.contains(document.activeElement)) {
    // Back where the visitor came from, unless they went elsewhere meanwhile.
    watch.focus({ preventScroll: true });
  }
}

/** Back to the heading and "Watch demo", with a fresh widget, closed. */
function rest() {
  pause(false);
  frame.classList.remove('tour--playing');
  choose(false);
  mount('user');
}

/** Play one side, once, then rest. */
async function play(pov) {
  const mine = ++current;
  await last;
  if (mine !== current) return;
  running = mine;
  pause(false);
  pick.hidden = true;
  frame.classList.add('tour--playing');
  last = (pov === 'owner' ? ownerRound() : userRound())
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

if (box && frame && page && subtitle && pausedNote && watch && pick) {
  await customElements.whenDefined('please-no-bugs');
  mount('user');
  watchSight();

  watch.addEventListener('click', () => choose(true));
  document.getElementById('tour-back')?.addEventListener('click', () => choose(false));
  pick.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') choose(false);
  });
  for (const side of pick.querySelectorAll('[data-pov]')) {
    side.addEventListener('click', (e) => {
      // Not also a click on the box, which would pause what just started.
      e.stopPropagation();
      void play(side.dataset.pov);
    });
  }
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
