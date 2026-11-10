/*
 * The Nimiq look's key visual, moving: ten layers of the logo's hexagon in a
 * group, each turning slowly (one round in four minutes), after Sören's
 * prototype for the Foundation (nimiq.github.io/brand-update-exploration).
 *
 * Every `[data-hexes]` gets its groups, named in the attribute
 * (`data-hexes="left right"`). nimiq.css places and colours them, and shows
 * them only in the Nimiq look; in the purple look they are not drawn, so
 * they cost nothing. A group is as big as 1.57 times its box is high, as in
 * the prototype, measured here so the steps between layers scale with it.
 */
const HEXAGON =
  'M19.734 8.156 15.576.844A1.66 1.66 0 0014.135 0H5.819C5.226 0 4.677.32 4.38.844L.222 8.156a1.71 1.71 0 000 1.688l4.158 7.312c.297.523.846.844 1.439.844h8.316c.593 0 1.142-.32 1.438-.844l4.158-7.312c.3-.523.3-1.165.003-1.688';

const LAYERS = 10;

function group(side) {
  const g = document.createElement('div');
  g.className = `hexes hexes--${side}`;
  for (let i = 0; i < LAYERS; i++) {
    const layer = document.createElement('div');
    layer.className = 'hexes__layer';
    layer.style.setProperty('--i', String(i));
    layer.innerHTML = `<svg viewBox="0 0 20 18" aria-hidden="true"><path d="${HEXAGON}"/></svg>`;
    g.append(layer);
  }
  return g;
}

for (const box of document.querySelectorAll('[data-hexes]')) {
  box.setAttribute('aria-hidden', 'true');
  for (const side of box.dataset.hexes.split(/\s+/).filter(Boolean)) box.append(group(side));
  const size = () => box.style.setProperty('--hx', `${Math.round(box.clientHeight * 1.57)}px`);
  size();
  new ResizeObserver(size).observe(box);
}
