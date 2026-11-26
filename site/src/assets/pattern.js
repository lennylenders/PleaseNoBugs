/**
 * The background of the home and Customize pages (`.page--pattern`), made
 * of separate glyphs so they can answer the cursor: those within a small
 * circle of it grow a little and light up, the nearest most, as a torch
 * passing over the wallpaper.
 *
 * The glyphs and where they sit come from `pattern.svg`, the one tile the
 * stylesheet repeats: read once, and laid out here as often as the window
 * needs, in one SVG behind the page that drifts as the tile did. Until it
 * is there, and wherever this does not run, the stylesheet's tile shows
 * instead (`.page--pattern::before`), so the page never goes bare.
 *
 * It also clears the bar at the top while the page is at its top.
 *
 * Only with a mouse or a trackpad: a touch screen has no cursor to follow,
 * and keeps the plain, faint pattern.
 */
const NS = 'http://www.w3.org/2000/svg';
/** How near the cursor a glyph lights up, and how far: a little bigger, a lot brighter. */
const REACH = 100;
const REST = 0.04;
const LIT = 0.6;
const GROW = 0.3;

const body = document.body;
const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');

/** The tile: its size, its glyphs (by id), and each glyph's place, size and turn. */
async function readTile() {
  const text = await fetch('assets/pattern.svg').then((r) => (r.ok ? r.text() : Promise.reject(r.status)));
  const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
  const tile = Number(svg.getAttribute('width'));
  const symbols = [...svg.querySelectorAll('symbol')];
  const glyphs = [...svg.querySelectorAll('use')].map((u) => {
    const turn = /rotate\(([-\d.]+)/.exec(u.getAttribute('transform') ?? '');
    return {
      id: (u.getAttribute('href') ?? '').slice(1),
      x: Number(u.getAttribute('x')),
      y: Number(u.getAttribute('y')),
      size: Number(u.getAttribute('width')),
      turn: turn ? Number(turn[1]) : 0,
    };
  });
  return { tile, symbols, glyphs };
}

/** Everything drawn, and where each glyph's middle is in the layer. */
let layer = null;
let drawn = [];

/** The tile laid out over the window and one tile more each way, for the drift. */
function lay({ tile, symbols, glyphs }) {
  layer?.remove();
  const w = window.innerWidth + 2 * tile;
  const h = window.innerHeight + 2 * tile;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'page-pattern');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  const defs = document.createElementNS(NS, 'defs');
  for (const s of symbols) defs.append(document.importNode(s, true));
  svg.append(defs);
  drawn = [];
  for (let ty = 0; ty < h; ty += tile) {
    for (let tx = 0; tx < w; tx += tile) {
      for (const g of glyphs) {
        // Each glyph in a group whose origin is its middle, so it turns and
        // grows in place.
        const cx = tx + g.x + g.size / 2;
        const cy = ty + g.y + g.size / 2;
        const at = document.createElementNS(NS, 'g');
        at.setAttribute('transform', `translate(${cx} ${cy})`);
        const use = document.createElementNS(NS, 'use');
        use.setAttribute('href', `#${g.id}`);
        use.setAttribute('x', String(-g.size / 2));
        use.setAttribute('y', String(-g.size / 2));
        use.setAttribute('width', String(g.size));
        use.setAttribute('height', String(g.size));
        use.style.transform = `rotate(${g.turn}deg)`;
        at.append(use);
        svg.append(at);
        drawn.push({ use, cx, cy, turn: g.turn, lit: 0 });
      }
    }
  }
  body.prepend(svg);
  body.classList.add('has-pattern');
  layer = svg;
}

/** Where the cursor is, or null when it is off the page. */
let at = null;
let frame = 0;

/** Light the glyphs near the cursor, and let go of the rest. */
function shine() {
  frame = 0;
  if (!layer) return;
  const r = layer.getBoundingClientRect();
  for (const d of drawn) {
    let t = 0;
    if (at) {
      const dist = Math.hypot(r.left + d.cx - at.x, r.top + d.cy - at.y);
      if (dist < REACH) {
        const k = 1 - dist / REACH;
        t = k * k * (3 - 2 * k);
      }
    }
    if (t === d.lit) continue;
    d.lit = t;
    d.use.style.opacity = t ? String(REST + (LIT - REST) * t) : '';
    d.use.style.transform = `rotate(${d.turn}deg) scale(${1 + GROW * t})`;
  }
  // The pattern drifts under a cursor that stands still: keep up with it.
  if (at && !document.hidden) frame = requestAnimationFrame(shine);
}

function follow(e) {
  at = { x: e.clientX, y: e.clientY };
  if (!frame) frame = requestAnimationFrame(shine);
}

function leave() {
  at = null;
  if (!frame) frame = requestAnimationFrame(shine);
}

/**
 * The bar at the top: clear while the page is at its top, so the glyphs
 * show through it too; solid once it is scrolled, so nothing runs under the
 * links. Without this it stays solid.
 */
function clearBar() {
  const bar = document.querySelector('.top');
  if (!bar) return;
  const update = () => bar.classList.toggle('top--scrolled', window.scrollY > 4);
  update();
  window.addEventListener('scroll', update, { passive: true });
  body.classList.add('top-clear');
}

if (body.classList.contains('page--pattern')) {
  clearBar();
  try {
    const tile = await readTile();
    lay(tile);
    let resize = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resize);
      resize = setTimeout(() => lay(tile), 200);
    });
    const listen = () => {
      if (pointer.matches) {
        document.addEventListener('mousemove', follow, { passive: true });
        document.documentElement.addEventListener('mouseleave', leave);
      } else {
        document.removeEventListener('mousemove', follow);
        leave();
      }
    };
    listen();
    pointer.addEventListener('change', listen);
  } catch {
    // The stylesheet's tile stays: the page is dressed, only not lit.
  }
}
