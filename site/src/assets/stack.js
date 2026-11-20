/*
 * The site's key visual (Nimiq brand styleguide 2026, "Background
 * visuals"): layers of the logo's rounded hexagon, each turned a little
 * further and fading, as a stack at the side of a hero. On navy the layers
 * are white at rising strength with the gold glow behind them; on white they
 * are fine navy outlines.
 *
 * Every `[data-stack]` gets one: `hero` (Home's navy hero, a stack at either
 * side) or `page` (a white intro, one stack at the right). The layers and
 * their places are the brand file's, read from Figma (page "PleaseNoBugs ·
 * Nimiq 2026"), not drawn anew. site.css turns them, as the brand's
 * "Motion" asks: every layer round the stack's middle, 60° in 32 s, each
 * 0.4 s behind the one in front; nothing moves for a visitor who asked for
 * less motion.
 */

/** The logo's hexagon, rounded, in the size the stack's layers have (1448 × 1291). */
const HEX =
  'M1431.9 584.8L1130.2 60.5C1119.6 42.2 1104.3 26.9 1086 16.3C1067.6 5.7 1046.8 0 1025.6 0L422.2 0C379.2 0 339.3 22.9 317.8 60.5L16.1 584.8C-5.4 622.3-5.4 668.4 16.1 705.9L317.8 1230.2C339.3 1267.7 379.2 1290.7 422.2 1290.7L1025.6 1290.7C1068.6 1290.7 1108.5 1267.8 1130 1230.2L1431.7 705.9C1442.3 687.5 1447.9 666.6 1448 645.4C1448 624.1 1442.5 603.3 1431.9 584.8Z';
const W = 1448;
const H = 1291;

/** Each layer: where it stands (an SVG matrix, back to front) and how strong its fill and line are. */
const RIGHT = [
  [0.435, -0.901, 0.901, 0.435, 828.2, 1123.2, 0.01, 0.05],
  [0.476, -0.879, 0.879, 0.476, 850, 1068.6, 0.02, 0.1],
  [0.517, -0.856, 0.856, 0.517, 874.3, 1015.1, 0.03, 0.15],
  [0.556, -0.831, 0.831, 0.556, 901, 962.8, 0.05, 0.2],
  [0.595, -0.804, 0.804, 0.595, 930.2, 911.7, 0.1, 0.2],
  [0.632, -0.775, 0.775, 0.632, 961.8, 862.1, 0.15, 0.2],
  [0.667, -0.745, 0.745, 0.667, 995.6, 814, 0.2, 0.2],
  [0.701, -0.713, 0.713, 0.701, 1031.6, 767.6, 0.3, 0.2],
  [0.734, -0.679, 0.679, 0.734, 1069.8, 722.9, 0.4, 0.2],
  [0.765, -0.644, 0.644, 0.765, 1110, 680, 0.5, 0.2],
];
const LEFT = [
  [-0.228, 0.974, -0.974, -0.228, 490.6, -377.9, 0.01, 0.05],
  [-0.273, 0.962, -0.962, -0.273, 481.2, -319.9, 0.02, 0.1],
  [-0.318, 0.948, -0.948, -0.318, 469.2, -262.4, 0.03, 0.15],
  [-0.362, 0.932, -0.932, -0.362, 454.5, -205.4, 0.05, 0.2],
  [-0.405, 0.914, -0.914, -0.405, 437.1, -149.3, 0.1, 0.2],
  [-0.448, 0.894, -0.894, -0.448, 417.1, -94, 0.15, 0.2],
  [-0.489, 0.872, -0.872, -0.489, 394.6, -39.7, 0.2, 0.2],
  [-0.529, 0.849, -0.849, -0.529, 369.5, 13.5, 0.3, 0.2],
  [-0.568, 0.823, -0.823, -0.568, 342, 65.4, 0.4, 0.2],
  [-0.606, 0.795, -0.795, -0.606, 312.1, 116, 0.5, 0.2],
];

/** The two kinds: their drawing box, their stacks, and how a layer is painted. */
const KINDS = {
  hero: { w: 1440, h: 725, stacks: [RIGHT, LEFT], fill: '#fff', line: '#fff', glow: true },
  // The page's: the right stack alone, 140px further left, white layers with navy lines.
  page: { w: 1440, h: 515, stacks: [RIGHT.map((l) => [...l.slice(0, 4), l[4] - 140, l[5], 1, 0.4])], fill: '#fff', line: '#040724', glow: false },
};

const NS = 'http://www.w3.org/2000/svg';

/** The middle of a stack: the mean of its layers' middles, which it turns round. */
function middle(layers) {
  let x = 0;
  let y = 0;
  for (const [a, b, c, d, e, f] of layers) {
    x += a * (W / 2) + c * (H / 2) + e;
    y += b * (W / 2) + d * (H / 2) + f;
  }
  return [x / layers.length, y / layers.length];
}

function draw(box) {
  const kind = KINDS[box.dataset.stack];
  if (!kind) return;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${kind.w} ${kind.h}`);
  svg.setAttribute('preserveAspectRatio', box.dataset.stack === 'page' ? 'xMaxYMid slice' : 'xMidYMid slice');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  let html = `<defs><path id="nq-hex" d="${HEX}"/>`;
  if (kind.glow) {
    html +=
      '<radialGradient id="nq-glow-a" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(520 42 -80 726 0 202)"><stop stop-color="#FEC658"/><stop offset="1" stop-color="#040724" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="nq-glow-b" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(-474 -499 946 -663 1452 769)"><stop stop-color="#FEC658"/><stop offset="1" stop-color="#040724" stop-opacity="0"/></radialGradient>';
  }
  html += '</defs>';
  if (kind.glow) html += `<rect width="${kind.w}" height="${kind.h}" fill="url(#nq-glow-a)"/><rect width="${kind.w}" height="${kind.h}" fill="url(#nq-glow-b)"/>`;
  for (const layers of kind.stacks) {
    const [cx, cy] = middle(layers);
    html += `<g class="stack__group" style="transform-origin: ${cx.toFixed(1)}px ${cy.toFixed(1)}px">`;
    layers.forEach(([a, b, c, d, e, f, fo, so], i) => {
      // The front layer leads; each one behind it follows 0.4 s later.
      const behind = layers.length - 1 - i;
      html +=
        `<g class="stack__layer" style="--behind: ${behind}; transform-origin: ${cx.toFixed(1)}px ${cy.toFixed(1)}px">` +
        `<use href="#nq-hex" transform="matrix(${a} ${b} ${c} ${d} ${e} ${f})" fill="${kind.fill}" fill-opacity="${fo}" stroke="${kind.line}" stroke-opacity="${so}" vector-effect="non-scaling-stroke"/></g>`;
    });
    html += '</g>';
  }
  svg.innerHTML = html;
  box.append(svg);
}

/**
 * On a narrow screen the hero is taller than wide and its middle alone would
 * show, with neither stack in it: there it is anchored at its right, so the
 * right stack and the glow under it stay in view.
 */
const narrow = window.matchMedia('(max-width: 700px)');
function anchor(box) {
  const svg = box.querySelector('svg');
  if (svg && box.dataset.stack === 'hero') svg.setAttribute('preserveAspectRatio', narrow.matches ? 'xMaxYMax slice' : 'xMidYMid slice');
}

for (const box of document.querySelectorAll('[data-stack]')) {
  box.setAttribute('aria-hidden', 'true');
  draw(box);
  anchor(box);
  narrow.addEventListener('change', () => anchor(box));
}
