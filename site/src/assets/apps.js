/**
 * Other apps' boards on the site, to read and scroll through. Not on any page
 * yet: it does nothing until a page has a place for it and `apps.json` has an
 * app in it.
 *
 *   <div data-pnb-apps></div>                     (data-src="..." for another list)
 *   <script src="widget/pleasenobugs.iife.js" defer></script>
 *   <script src="assets/apps.js" defer></script>
 *
 * **An app is listed only because its developer asked**, by adding it to
 * `apps.json` in a pull request: `{ "name", "server", "project", "url" }`,
 * where `url` is where the app runs. Nothing finds boards by itself, and the
 * telemetry never says where a server is.
 *
 * **The visitor's browser reads each board from that app's own server**, as a
 * stranger, the way anybody may read a board. This site keeps no copy of
 * anything. Each board is a `<please-no-bugs readonly>`: no writing, no votes,
 * every post anonymous and without its screenshot, since its authors chose
 * those for their app's board and not for this page.
 */

const root = document.querySelector('[data-pnb-apps]');
if (root) void start(root);

async function start(root) {
  const apps = (await loadList(root.dataset.src || 'apps.json')).filter(listable);
  if (!apps.length) {
    root.hidden = true;
    return;
  }
  await customElements.whenDefined('please-no-bugs');
  const { createClient } = window.PleaseNoBugs;
  root.classList.add('apps');

  const picker = el('div', 'apps__picker');
  picker.setAttribute('role', 'tablist');
  picker.setAttribute('aria-label', 'Apps');
  const board = document.createElement('please-no-bugs');
  board.setAttribute('readonly', '');
  board.setAttribute('theme', 'pleasenobugs');
  board.setAttribute('lang', 'en');
  const device = el('div', 'device');
  device.append(board);
  const open = el('a', 'apps__open');
  open.rel = 'noopener';
  root.append(picker, device, open);

  const tabs = apps.map((app) => {
    const tab = el('button', 'apps__tab');
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    const counts = el('span', 'apps__counts', '…');
    tab.append(el('span', 'apps__name', app.name), counts);
    tab.addEventListener('click', () => pick(app, tab));
    picker.append(tab);
    // Read once more for the numbers, as a stranger, remembering nothing.
    const client = createClient({ server: app.server, project: app.project, signer: null, appLogin: null, storage: null });
    void client.board().then((res) => {
      counts.textContent = res.ok ? summary(res.data.posts) : 'Not reachable right now';
    });
    return tab;
  });

  function pick(app, tab) {
    for (const t of tabs) t.setAttribute('aria-selected', String(t === tab));
    board.setAttribute('app-name', app.name);
    board.setAttribute('server', app.server);
    board.setAttribute('project', app.project);
    open.hidden = !app.url;
    if (app.url) {
      open.href = app.url;
      open.textContent = `Give feedback in ${app.name}`;
    }
  }
  pick(apps[0], tabs[0]);
}

/** The list, or none when it cannot be read: the section then stays away. */
async function loadList(src) {
  try {
    const res = await fetch(src, { cache: 'no-store' });
    const body = await res.json();
    return Array.isArray(body?.apps) ? body.apps : [];
  } catch {
    return [];
  }
}

/** Whether an entry is one to show. A broken one is left out and said in the console. */
function listable(app) {
  const ok =
    app &&
    typeof app.name === 'string' &&
    app.name.trim() !== '' &&
    app.name.length <= 60 &&
    typeof app.project === 'string' &&
    /^[a-z0-9-]{1,64}$/i.test(app.project) &&
    isWeb(app.server) &&
    (app.url === undefined || isWeb(app.url));
  if (!ok) console.warn('[apps] left out of the list:', app);
  return ok;
}

/** https, or http on this machine for trying the list with a local server. */
function isWeb(v) {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || (u.protocol === 'http:' && u.hostname === 'localhost');
  } catch {
    return false;
  }
}

/** "3 bugs · 5 ideas · 2 reviews · 4 done", leaving out what there is none of. */
function summary(posts) {
  const n = (f) => posts.filter(f).length;
  const parts = [
    [n((p) => p.kind === 'bug'), 'bug', 'bugs'],
    [n((p) => p.kind === 'idea'), 'idea', 'ideas'],
    [n((p) => p.kind === 'review'), 'review', 'reviews'],
    [n((p) => p.status === 'done'), 'done', 'done'],
  ].filter(([count]) => count > 0);
  return parts.length ? parts.map(([c, one, many]) => `${c} ${c === 1 ? one : many}`).join(' · ') : 'Nothing yet';
}

/** An element with a class and, optionally, text: never HTML, since the counts come from other servers. */
function el(tag, cls, text) {
  const e = document.createElement(tag);
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
