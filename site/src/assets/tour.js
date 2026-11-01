/**
 * The home page's tour: the real widget, in `demo` mode, playing through
 * what it is on its own, over and over, on the configurator's pretend app.
 *
 * As a user meets it: tap the round button, pick Report a bug on the tiles,
 * describe it, send it, and only then the board, with everybody else's
 * feedback and the app's answers, where an idea gets a vote. A subtitle says
 * what each step is (`STEPS`), a ring shows each tap, as in the
 * configurator's step 1.
 *
 * The box is `inert`: a visitor watches, nothing in it takes a tap. The
 * taps here are the widget's own buttons, clicked from this script, so what
 * plays is what the widget really does. A fresh widget every round, so the
 * demo board starts over too: its posts live only in the page's memory and
 * nothing leaves the browser.
 *
 * It waits while the box is off screen or the tab is hidden, and with
 * reduced motion it holds the board open, still.
 */
const box = document.getElementById('tour');
const subtitle = document.getElementById('tour-say');

/** What the tour writes, typed out a letter at a time. */
const BUG = 'The save button does nothing on my phone';

/** The subtitle per step: what is happening, and what it means for you. */
const STEPS = [
  ['Tap the button', 'Your users find a round button in a corner of your app.'],
  ['Pick what it is', 'A bug, an idea or a review. Here: a bug.'],
  ['Describe it', 'In their own words, right where it happened. No email, no account.'],
  ['Sent', 'It goes straight onto your board.'],
  ['See everyone’s feedback', 'All posts are open for anyone to read, with your answers under them.'],
  ['Vote', 'Users vote up what they want too, so you know what matters most.'],
];

/** The same settings as the configurator's widgets, and no screenshots: the tour never adds one. */
function widget() {
  const el = document.createElement('please-no-bugs');
  for (const [k, v] of Object.entries({
    demo: '',
    mode: 'floating',
    theme: 'pleasenobugs',
    lang: 'en',
    screenshots: 'off',
  })) {
    el.setAttribute(k, v);
  }
  return el;
}

/**
 * The widget sizes its corner panel to the window (at most 640px high), and
 * the box is shorter: without this its top would be cut off. As `fitPanel`
 * in customize.js, put in from here rather than in the widget.
 */
function fit(el) {
  let style = el.shadowRoot.querySelector('style[data-site]');
  if (!style) {
    style = document.createElement('style');
    style.dataset.site = '';
    el.shadowRoot.append(style);
  }
  const h = box.clientHeight - 48;
  style.textContent = `@media (min-width: 640px) { .overlay, .overlay .app { max-height: ${h}px; } }`;
}

// ---- Waiting, only while somebody can see it ----------------------------

let seen = true;
let wake = null;
const gate = () => (seen ? Promise.resolve() : new Promise((r) => (wake = r)));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** A pause in the tour, which also holds it while it is out of sight. */
const wait = async (ms) => {
  await sleep(ms);
  await gate();
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

/** Scroll the panel just enough to show `target`, so a tap on it is seen. */
async function reveal(target) {
  const list = target.closest('.scroll');
  if (!list) return;
  const l = list.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const by = t.bottom > l.bottom - 24 ? t.bottom - l.bottom + 24 : t.top < l.top + 24 ? t.top - l.top - 24 : 0;
  if (!by) return;
  list.scrollBy({ top: by, behavior: 'smooth' });
  await wait(600);
}

/** Type `text` into the widget's field, the way a person would, as the widget hears it. */
async function type(field, text) {
  for (let i = 1; i <= text.length; i++) {
    field.value = text.slice(0, i);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(45 + Math.random() * 40);
  }
}

/** A button in the panel's bar, by its label. */
const barButton = (label) => (root) => root.querySelector(`.bar [aria-label="${label}"]`);

/** Put step `n` (from 1) in the subtitle, the old one fading out first. */
async function say(n) {
  if (!subtitle) return;
  const [title, text] = STEPS[n - 1];
  subtitle.classList.add('tour-say--away');
  await sleep(180);
  subtitle.querySelector('.tour-say__n').textContent = `Step ${n} of ${STEPS.length}`;
  subtitle.querySelector('.tour-say__title').textContent = title;
  subtitle.querySelector('.tour-say__text').textContent = text;
  subtitle.classList.remove('tour-say--away');
}

async function round() {
  box.querySelector('please-no-bugs')?.remove();
  const el = widget();
  box.append(el);
  await customElements.whenDefined('please-no-bugs');
  fit(el);

  await say(1);
  await wait(2200);
  await tap(await find(el, '.fab'));

  // The tiles: a bug.
  const tile = await find(el, '.tile--bug');
  await say(2);
  await wait(2200);
  await tap(tile);

  // Written and sent.
  const field = await find(el, 'textarea.field');
  await say(3);
  await wait(1200);
  await type(field, BUG);
  await wait(800);
  const send = await find(el, '.send .btn:not([disabled])');
  await reveal(send);
  await tap(send);
  await find(el, '.sent');
  await say(4);
  await wait(2400);

  // Only now the board: everybody else's feedback and the app's answers.
  await tap(await find(el, '.sent__back'));
  await find(el, '.list');
  await say(5);
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
  await say(6);
  await reveal(vote);
  await wait(1400);
  await tap(vote);
  await wait(2400);

  await tap(await find(el, barButton('Close')));
  await wait(900);
}

if (box) {
  await customElements.whenDefined('please-no-bugs');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Still: the board, open, as the tour would show it.
    const el = widget();
    el.setAttribute('screen', 'board');
    box.append(el);
    fit(el);
    await say(5);
  } else {
    watchSight();
    for (;;) {
      try {
        await round();
      } catch (e) {
        // A step that did not find its button: start the round over rather than stop.
        console.warn(e);
        await wait(1000);
      }
    }
  }
}
