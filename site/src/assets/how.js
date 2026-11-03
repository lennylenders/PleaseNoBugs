/**
 * The drawings on What is it?, one per part. Each is HTML in the widget's
 * colours and glyphs (what-is-it.html, site.css), not the widget: this script plays it
 * by putting classes on its `.stage` and the things in it, and site.css moves
 * them there.
 *
 * - **What it is about**: three users each say something in a bubble, a bug,
 *   an idea and a review, and it lands on the board; the others read along
 *   and vote for the idea; you answer the bug, it is Done and fixed in a
 *   version, and whoever reported it gets a tick. About 10 s, then again.
 * - **Why**: votes go up and Top sorts the board by them; somebody starts on
 *   an idea that is there already, "Said already, maybe?" shows it, and they
 *   vote for it instead; the board turns light, in other colours. About 13 s,
 *   then again.
 * - **How to add it**: the script and the tag are typed, the button appears
 *   and opens. Then, over and over, `mode` changes to inline, overlay and back
 *   to floating, and the app with it. The typing is only once.
 *
 * A drawing starts when it comes into view, and its time stands still while
 * it is out of view or the tab is hidden. With reduced motion each shows its
 * last picture and nothing moves.
 */
const still = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Thrown out of a drawing that has to stop: reduced motion was switched on. */
const STOP = Symbol('stop');

/**
 * Play `run` on `stage` while motion is allowed, else show `end`. `run` gets
 * a `sleep` whose time only passes while the stage can be seen.
 */
function stage(el, run, end) {
  if (!el) return;
  let seen = false;
  let onScreen = false;
  const update = () => (seen = onScreen && !document.hidden);
  new IntersectionObserver(
    ([e]) => {
      onScreen = e.isIntersecting;
      update();
    },
    { threshold: 0.35 },
  ).observe(el);
  document.addEventListener('visibilitychange', update);

  /** `ms` of the drawing's own time, counted in short steps. */
  async function sleep(ms) {
    let left = ms;
    while (left > 0) {
      const step = Math.min(left, 50);
      await new Promise((r) => setTimeout(r, step));
      if (still.matches) throw STOP;
      if (seen) left -= step;
    }
  }

  let playing = false;
  async function go() {
    if (still.matches) return end();
    if (playing) return;
    playing = true;
    try {
      await run(sleep);
    } catch (e) {
      if (e !== STOP) console.warn(e);
      end();
    }
    playing = false;
  }
  still.addEventListener('change', go);
  void go();
}

/** Show a tap on `target`: the tour's ring, in the stage. */
async function tap(el, target, sleep) {
  const b = el.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const ring = document.createElement('span');
  ring.className = 'tour-tap';
  ring.style.left = `${t.left + t.width / 2 - b.left}px`;
  ring.style.top = `${t.top + t.height / 2 - b.top}px`;
  el.append(ring);
  requestAnimationFrame(() => ring.classList.add('tour-tap--on'));
  setTimeout(() => ring.remove(), 600);
  await sleep(180);
}

/** One vote more on `vote`, with a little bump. */
function bump(vote, voted = false) {
  const n = vote.querySelector('[data-count]');
  n.textContent = String(Number(n.textContent) + 1);
  if (voted) vote.classList.add('is-voted');
  vote.classList.add('is-bump');
  setTimeout(() => vote.classList.remove('is-bump'), 200);
}

// ---- 1. What it is about ------------------------------------------------

{
  const el = document.getElementById('about');
  const who = el ? Object.fromEntries([...el.querySelectorAll('[data-who]')].map((w) => [w.dataset.who, w])) : {};
  const post = el ? Object.fromEntries([...el.querySelectorAll('[data-post]')].map((p) => [p.dataset.post, p])) : {};
  const vote = el?.querySelector('[data-vote]');
  /** Who says what, in turn: each one a post. */
  const SAYS = [
    ['sam', 'bug'],
    ['mira', 'idea'],
    ['jo', 'review'],
  ];

  function reset() {
    el.classList.remove('is-stars', 'is-answered');
    for (const w of Object.values(who)) w.classList.remove('is-saying', 'is-sent', 'is-reading', 'is-thanked');
    for (const p of Object.values(post)) p.classList.remove('is-in');
    vote.classList.remove('is-voted');
    vote.querySelector('[data-count]').textContent = '1';
  }

  function end() {
    reset();
    el.classList.remove('is-resetting');
    for (const p of Object.values(post)) p.classList.add('is-in');
    el.classList.add('is-stars', 'is-answered');
    who.sam.classList.add('is-thanked');
    bump(vote);
    bump(vote, true);
  }

  /** `w` says it in a bubble, and the bubble goes off into the board. */
  async function say(w, sleep) {
    w.classList.add('is-saying');
    await sleep(850);
    w.classList.add('is-sent');
    await sleep(160);
  }

  stage(
    el,
    async (sleep) => {
      for (;;) {
        reset();
        await sleep(600);

        for (const [w, p] of SAYS) {
          await say(who[w], sleep);
          post[p].classList.add('is-in');
          if (p === 'review') el.classList.add('is-stars');
          await sleep(380);
          who[w].classList.remove('is-saying', 'is-sent');
        }
        await sleep(200);

        // The others read along, and vote for the idea.
        for (const w of ['sam', 'jo']) {
          who[w].classList.add('is-reading');
          bump(vote, w === 'jo');
          await sleep(450);
          who[w].classList.remove('is-reading');
          await sleep(150);
        }
        await sleep(300);

        // You answer the bug, and Sam sees it fixed.
        await say(who.you, sleep);
        el.classList.add('is-answered');
        await sleep(500);
        who.you.classList.remove('is-saying', 'is-sent');
        who.sam.classList.add('is-thanked');
        await sleep(2400);

        // Faded out, put back, faded in, and a rest.
        el.classList.add('is-resetting');
        await sleep(450);
        reset();
        el.classList.remove('is-resetting');
        await sleep(1500);
      }
    },
    end,
  );
}

// ---- 2. Why ---------------------------------------------------------------

{
  const el = document.getElementById('why');
  const rows = el ? Object.fromEntries([...el.querySelectorAll('[data-idea]')].map((r) => [r.dataset.idea, r])) : {};
  const START = { export: 3, dark: 9, buttons: 5, link: 2 };
  const NEW = ['export', 'dark', 'buttons', 'link'];
  /** What is typed, and the votes that come in before: dark mode most. */
  const TYPED = 'Dark mode pls';
  const VOTES = ['dark', 'buttons', 'dark', 'export', 'dark', 'buttons', 'dark', 'dark'];
  const typed = el?.querySelector('[data-typed]');
  const alike = el?.querySelector('[data-tap="alike"]');
  const sort = (on) => {
    for (const s of el.querySelectorAll('[data-sort]')) s.classList.toggle('is-on', s.dataset.sort === on);
  };
  const count = (id) => Number(rows[id].querySelector('[data-count]').textContent);
  /** Rows in this order, top first. */
  const place = (order) => order.forEach((id, i) => rows[id].style.setProperty('--i', String(i)));
  const byVotes = () => place(Object.keys(rows).sort((a, b) => count(b) - count(a)));

  function reset() {
    el.classList.remove('is-writing', 'is-alike', 'is-light');
    for (const [id, n] of Object.entries(START)) {
      rows[id].querySelector('[data-count]').textContent = String(n);
      rows[id].querySelector('.vote').classList.remove('is-voted');
      rows[id].classList.remove('is-top');
    }
    alike.classList.remove('is-voted');
    alike.querySelector('[data-count]').textContent = '14';
    typed.textContent = '';
    sort('new');
    place(NEW);
  }

  function end() {
    reset();
    for (const id of VOTES) rows[id].querySelector('[data-count]').textContent = String(count(id) + 1);
    bump(rows.dark.querySelector('.vote'), true);
    sort('top');
    byVotes();
    rows.dark.classList.add('is-top');
  }

  stage(
    el,
    async (sleep) => {
      for (;;) {
        reset();
        el.classList.remove('is-resetting');
        await sleep(1000);

        // Votes come in, then Top puts the most wanted first.
        for (const id of VOTES) {
          bump(rows[id].querySelector('.vote'));
          await sleep(220);
        }
        await sleep(400);
        await tap(el, el.querySelector('[data-tap="top"]'), sleep);
        sort('top');
        byVotes();
        await sleep(500);
        rows.dark.classList.add('is-top');
        await sleep(1400);

        // Somebody writes what is there already, and votes for it instead.
        el.classList.add('is-writing');
        await sleep(700);
        for (let i = 1; i <= TYPED.length; i++) {
          typed.textContent = TYPED.slice(0, i);
          await sleep(55 + Math.random() * 30);
          if (i === 6) el.classList.add('is-alike');
        }
        await sleep(1300);
        await tap(el, alike, sleep);
        bump(alike, true);
        await sleep(900);
        el.classList.remove('is-writing', 'is-alike');
        await sleep(300);
        bump(rows.dark.querySelector('.vote'), true);
        await sleep(1600);

        // In your colours: here, the widget's light theme.
        el.classList.add('is-light');
        await sleep(2800);

        el.classList.add('is-resetting');
        await sleep(450);
        reset();
        await sleep(100);
        el.classList.remove('is-resetting');
        await sleep(1200);
      }
    },
    end,
  );
}

// ---- 3. How to add it -----------------------------------------------------

{
  const el = document.getElementById('add');
  const out = el?.querySelector('[data-code]');
  const says = el?.querySelector('[data-says]');
  const VERSION = '%VERSION%';

  /** The code as pieces: a class to colour it with (as customize.js's), and its text. `mode` is the part that changes. */
  const CODE = [
    ['t', '<script'], ['', ' '], ['a', 'src'], ['', '='], ['s', `"https://unpkg.com/pleasenobugs@${VERSION}"`], ['t', '>'], ['t', '</script'], ['t', '>'], ['', '\n'],
    ['t', '<please-no-bugs'], ['', '\n  '],
    ['a', 'project'], ['', '='], ['s', '"YOUR_PROJECT_ID"'], ['', '\n  '],
    ['a', 'server'], ['', '='], ['s', '"https://YOUR_SERVER"'], ['', '\n  '],
    ['a', 'mode'], ['', '='], ['mode', ''], ['', '\n'],
    ['t', '>'], ['t', '</please-no-bugs'], ['t', '>'],
  ];
  /** What each way is, under the app. */
  const SAYS = {
    floating: 'A round button in the corner',
    inline: 'Part of your own page',
    overlay: 'Over your page, from your own menu',
  };

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const CARET = '<i class="caret"></i>';
  /** The code with `mode` set, as HTML, cut off after `upto` characters, with a caret before character `caret` if asked. */
  function render(mode, { upto = Infinity, caret = -1 } = {}) {
    let at = 0;
    let html = '';
    for (const [cls, text] of CODE) {
      if (at >= upto) break;
      const part = (cls === 'mode' ? `"${mode}"` : text).slice(0, upto - at);
      const piece =
        caret >= at && caret < at + part.length
          ? esc(part.slice(0, caret - at)) + CARET + esc(part.slice(caret - at))
          : esc(part);
      html += cls ? `<span class="${cls === 'mode' ? 's' : cls}">${piece}</span>` : piece;
      at += part.length;
    }
    return html + (caret >= at ? CARET : '');
  }
  const length = (mode) => CODE.reduce((n, [cls, text]) => n + (cls === 'mode' ? mode.length + 2 : text.length), 0);
  /** Where `mode`'s value starts, after its opening quote. */
  const modeAt = CODE.slice(0, CODE.findIndex(([cls]) => cls === 'mode')).reduce((n, [, text]) => n + text.length, 1);

  async function say(mode, sleep) {
    says.classList.add('is-away');
    await sleep(200);
    says.innerHTML = `<code>mode="${mode}"</code> · ${SAYS[mode]}`;
    says.classList.remove('is-away');
  }

  function reset() {
    el.classList.remove('has-tag', 'is-open');
    el.dataset.mode = 'floating';
    out.innerHTML = '';
    says.textContent = '';
  }

  function end() {
    reset();
    out.innerHTML = render('floating');
    el.classList.add('has-tag', 'is-open');
    says.innerHTML = `<code>mode="floating"</code> · ${SAYS.floating}`;
  }

  /** Type the value of `mode` over the old one, the rest of the code staying: back to the quote, then the new word. */
  async function retype(from, to, sleep) {
    for (let n = from.length; n >= 0; n--) {
      out.innerHTML = render(from.slice(0, n), { caret: modeAt + n });
      await sleep(45);
    }
    for (let n = 1; n <= to.length; n++) {
      out.innerHTML = render(to.slice(0, n), { caret: modeAt + n });
      await sleep(80);
    }
    await sleep(300);
    out.innerHTML = render(to);
  }

  /** One way of showing it, played in the app. */
  async function show(mode, sleep) {
    el.dataset.mode = mode;
    await say(mode, sleep);
    if (mode === 'inline') {
      await sleep(3600);
    } else if (mode === 'overlay') {
      await sleep(700);
      await tap(el, el.querySelector('[data-tap="menu"]'), sleep);
      el.classList.add('is-open');
      await sleep(3000);
      el.classList.remove('is-open');
      await sleep(500);
    } else {
      await sleep(800);
      await tap(el, el.querySelector('[data-tap="fab"]'), sleep);
      el.classList.add('is-open');
      await sleep(2800);
      el.classList.remove('is-open');
      await sleep(700);
    }
  }

  if (el) el.querySelector('[data-ghost]').innerHTML = render('floating');

  stage(
    el,
    async (sleep) => {
      reset();
      await sleep(600);
      // Typed once, a letter at a time; the script's long line goes quicker.
      const all = length('floating');
      const script = CODE.findIndex(([, text]) => text === '\n');
      const quick = CODE.slice(0, script).reduce((n, [, text]) => n + text.length, 0);
      for (let n = 1; n <= all; n++) {
        out.innerHTML = render('floating', { upto: n, caret: n });
        await sleep(n < quick ? 12 : 26);
      }
      await sleep(400);
      out.innerHTML = render('floating');
      el.classList.add('has-tag');
      await show('floating', sleep);

      let mode = 'floating';
      for (;;) {
        for (const next of ['inline', 'overlay', 'floating']) {
          await retype(mode, next, sleep);
          mode = next;
          await show(mode, sleep);
        }
      }
    },
    end,
  );
}
