# pleasenobugs

The [PleaseNoBugs](../../README.md) widget: a feedback board in one tag, plus
the headless client it is built on. Inside Nimiq Pay it signs with the user's
wallet by itself; everywhere else it reads, and your app can hand it a signer.

## One line, a button in the corner

```html
<script src="https://unpkg.com/pleasenobugs"></script>
<please-no-bugs project="YOUR_PROJECT_ID" server="https://YOUR_SERVER" mode="floating"></please-no-bugs>
```

## Three ways to show it

| `mode` | What it does |
|---|---|
| `inline` (default) | Fills the element. Give it a height, or it grows with its posts. |
| `floating` | A small button in the corner that opens the board over the whole screen. |
| `overlay` | The board over the whole screen, right now. |

From a button of your own:

```js
import { open } from 'pleasenobugs';
menuItem.onclick = () => open({ project: 'YOUR_PROJECT_ID', server: 'https://YOUR_SERVER' });
```

## Attributes, properties and events

| Attribute | |
|---|---|
| `project`, `server` | Required. |
| `mode` | `inline`, `floating` or `overlay`. |
| `lang` | `en`, `nl`, `de`, or any code you supply `strings` for. Defaults to Nimiq Pay's language, then the page's. |
| `theme` | `auto` (follows the phone), `light`, `dark`, `shitti`. |
| `accent` | One colour, e.g. `#e84a5f`. The text on it picks black or white by itself. |
| `app-name` | What answers are signed with ("Shitti says"). Defaults to the project's name. |
| `name` | A display name you already know, offered when the user chooses to show theirs. |

| Property | |
|---|---|
| `signer` | How to sign outside Nimiq Pay (below). |
| `appLogin` | Your app's own login signature, so nobody signs twice (below). |
| `context` | Sent with every bug report, to owners only: `{ version: '1.4.0' }`. |
| `noise` | Words common in your app, so "said already?" ignores them: `['nim', 'wallet']`. |
| `strings` | Override any text: `{ 'board.title': 'Ideas box' }`. Keys are in `src/i18n.ts`. |

Events: `pleasenobugs:posted` (`detail: { id, kind }`) and `pleasenobugs:close`.

## Theming

The widget lives in a shadow root, so your CSS cannot break it. These custom
properties cross that boundary on purpose and are the theming API:

```css
please-no-bugs {
  --pnb-bg: #fff;            /* the page */
  --pnb-surface: #f4f4f7;    /* a card */
  --pnb-surface-2: #e8e8ef;  /* a chip or field inside a card */
  --pnb-sunken: #e8e8ef;     /* the Top/New trough */
  --pnb-line: #dcdce5;
  --pnb-text: #1b1b24;
  --pnb-text-quiet: #5a5a6b;
  --pnb-accent: #2563eb;
  --pnb-on-accent: #fff;
  --pnb-danger: #d23b2f;
  --pnb-bug: #e5484d;  --pnb-idea: #e9a00b;
  --pnb-planned: #3e7bfa;  --pnb-done: #2f9e66;  --pnb-declined: #8b8d98;
  --pnb-radius: 8px;
  --pnb-radius-sheet: 16px;
  --pnb-font: inherit;       /* your app's font */
  --pnb-z: 2147483000;       /* overlay and floating button */
  --pnb-inset-top: env(safe-area-inset-top, 0px);       /* what covers the screen's top */
  --pnb-inset-bottom: env(safe-area-inset-bottom, 0px); /* and its bottom */
}
```

**Inside Nimiq Pay, set the two insets yourself if you measure Pay's bar.**
Pay draws its own bar over the page and `env()` cannot see it, so a full-screen
board can end up underneath it. Only the overlay and the floating button use
them; an inline board ignores both.

## Reusing your app's own login

If your app already has users sign a fixed login message, hand that signature
to the widget and nobody signs twice:

```js
board.appLogin = { address, publicKey, signature, message: 'Sign in to My app' };
```

The project has to list that exact message first (`loginMessages`, through the
dashboard or `create-project --login-message`). Set `appLogin` to `null` when
the user logs out of your app.

## Signing outside Nimiq Pay

Give the element a function that signs a message and says which address did.
With the Nimiq Hub:

```js
import HubApi from '@nimiq/hub-api';
const hub = new HubApi('https://hub.nimiq.com');
const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

document.querySelector('please-no-bugs').signer = async (message) => {
  const r = await hub.signMessage({ appName: 'My app', message });
  return { address: r.signer, publicKey: hex(r.signerPublicKey), signature: hex(r.signature) };
};
```

Without a signer outside Nimiq Pay, the board is read-only and says so when
somebody tries to post.

## Headless

Everything the widget does goes through a client you can use directly, with no
UI and no Preact:

```js
import { createClient, sortPosts, createMatcher } from 'pleasenobugs/client';

const client = createClient({ server: 'https://YOUR_SERVER', project: 'YOUR_PROJECT_ID' });
const board = await client.board();          // never asks the wallet
if (board.ok) render(sortPosts(board.data.posts, 'top'));
await client.post({ id: crypto.randomUUID(), kind: 'idea', text: 'Dark mode' });   // asks once, then remembers
```

Every call answers `{ ok: true, data }` or `{ ok: false, status, error }`, and
never throws.

## Try it

```bash
npm run build && npm run demo -w pleasenobugs
```

Opens a demo on http://localhost:5180 with a seeded board and three fake
wallets to switch between. The demo server signs for them; nothing in the
package does.
