/**
 * The drawing on Why PleaseNoBugs, beside "Feedback without the black hole".
 * It is HTML in the widget's colours and glyphs (what-is-it.html, site.css),
 * not the widget: this script plays it by putting classes on its `.stage` and
 * the things in it, and site.css moves them there.
 *
 * - **What it is about**: three users each say something in a bubble, a bug,
 *   an idea and a review, and it lands on the board; the others read along
 *   and vote for the idea; you answer the bug, it is Done and fixed in a
 *   version, and whoever reported it says thanks. About 10 s, then again.
 *
 * It starts when it comes into view, and its time stands still while it is
 * out of view or the tab is hidden. With reduced motion it shows its last
 * picture and nothing moves.
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
    ['fons', 'bug'],
    ['ines', 'idea'],
    ['micha', 'review'],
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
    who.fons.classList.add('is-thanked');
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
        for (const w of ['fons', 'micha']) {
          who[w].classList.add('is-reading');
          bump(vote, w === 'micha');
          await sleep(450);
          who[w].classList.remove('is-reading');
          await sleep(150);
        }
        await sleep(300);

        // The app developer answers the bug, and Fons thanks them for the fix.
        await say(who.you, sleep);
        el.classList.add('is-answered');
        await sleep(500);
        who.you.classList.remove('is-saying', 'is-sent');
        who.fons.classList.add('is-thanked');
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
