/**
 * The home page's tour: the real widget, in `demo` mode, playing through
 * what it is on its own, over and over, on the configurator's pretend app.
 * Two sides to pick from under the box:
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
 * tap, as in the configurator's step 1.
 *
 * The box is `inert`: a visitor watches, nothing in it takes a tap. The
 * taps here are the widget's own buttons, clicked from this script, so what
 * plays is what the widget really does. A fresh widget every round, so the
 * demo board starts over too: its posts live only in the page's memory and
 * nothing leaves the browser.
 *
 * It waits while the box is off screen or the tab is hidden, starts over at
 * once on the other side when that is picked, and with reduced motion it
 * holds the board open, still.
 */
const box = document.getElementById('tour');
const subtitle = document.getElementById('tour-say');
const about = document.getElementById('tour-about');
const picker = document.querySelector('.tour-pov');

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

/** The line under the box, per side. */
const ABOUT = {
  user: 'Everything your users post is on the board, open for anyone to read and vote on.',
  owner: 'You answer on the same board, say what is fixed and where, and tell everyone what changed.',
};

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

// ---- Waiting: only while somebody can see it, and never past a switch ----

/** Thrown out of a round when the other side is picked. */
const STOP = Symbol('stop');
/** Which round is current; a round that is not stops at its next pause. */
let round = 0;
let playing = 0;
let switched = () => {};
let onSwitch = new Promise((r) => (switched = r));

let seen = true;
let wake = null;
const gate = () => (seen ? Promise.resolve() : new Promise((r) => (wake = r)));

/** A pause, cut short by a switch, after which the old round stops. */
const sleep = (ms) =>
  Promise.race([new Promise((r) => setTimeout(r, ms)), onSwitch]).then(() => {
    if (playing !== round) throw STOP;
  });
/** How much longer every pause is than the numbers below say: time to take each step in. */
const PACE = 1.5;

/** A pause in the tour, which also holds it while it is out of sight. Typing and taps keep their speed. */
const wait = async (ms) => {
  await sleep(ms * PACE);
  await Promise.race([gate(), onSwitch]);
  if (playing !== round) throw STOP;
};

function watchSight() {
  let onScreen = true;
  const update = () => {
    seen = onScreen && !document.hidden;
    if (seen && wake) {
      wake();
      wake = null;
    }
  };
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
  list?.scrollBy({ top: by, behavior: 'smooth' });
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
  list.scrollBy({ top: by, behavior: 'smooth' });
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
  if (!subtitle) return;
  subtitle.classList.add('tour-say--away');
  await sleep(180);
  subtitle.textContent = steps[n - 1];
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

let pov = 'user';

/** Show the side picked: the line under the box, and the tour over from step 1. */
function pick(next) {
  pov = next;
  if (about) about.textContent = ABOUT[pov];
  round += 1;
  switched();
  onSwitch = new Promise((r) => (switched = r));
}

if (box) {
  await customElements.whenDefined('please-no-bugs');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const steps = () => (pov === 'owner' ? OWNER : USER);
  // Still: the board, open, as the tour would show it on that side.
  const hold = async () => {
    playing = round;
    const el = mount(pov);
    el.setAttribute('screen', 'board');
    await say(steps(), 5);
  };
  picker?.addEventListener('change', (e) => {
    pick(e.target.value);
    if (still) void hold();
  });
  if (still) {
    await hold();
  } else {
    watchSight();
    for (;;) {
      playing = round;
      try {
        await (pov === 'owner' ? ownerRound() : userRound());
      } catch (e) {
        if (e === STOP) continue;
        // A step that did not find its button: start the round over rather than stop.
        console.warn(e);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
}
