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
| `floating` | A round button in the corner. It opens on the tiles (bug, idea, review), with the board one tap under them. |
| `overlay` | The board, right now. |

`floating` and `overlay` cover the whole screen on a phone. From 640 pixels
wide they are a panel in the bottom-right corner instead, 375 wide and up to
640 tall, over a dimmed page; a click beside it or Escape closes it.

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
| `theme` | `auto` (follows the phone), `light`, `dark`, `pleasenobugs` (dark purple, the website's look), `nimiq` (painted tiles and a gradient button, light only). `shitti` is the old name of `pleasenobugs` and still works. |
| `accent` | One colour, e.g. `#e84a5f`. The text on it picks black or white by itself. |
| `app-name` | What answers are signed with ("Shitti says"). Defaults to the project's name. |
| `name` | A display name you already know, offered when the user chooses to show theirs. |
| `kinds` | Which kinds to offer, of the ones your project takes: `bug,idea,review` by default. `kinds="bug,idea"` leaves reviews off the tiles and out of the list. |
| `screenshots` | `off` leaves out the "Add a screenshot" button on bugs and ideas. |
| `demo` | A board of sample posts in the page's memory, with no server: `<please-no-bugs demo>`. Voting and writing work, nothing is sent or stored, and a reload starts over. For trying the widget, or showing it off. |
| `screen` | With `demo` only: hold one screen in view, `button`, `tiles`, `board`, `write` or `sent`. What the website's configurator uses to show the part you are changing. |

| Property | |
|---|---|
| `signer` | How to sign outside Nimiq Pay (below). |
| `appLogin` | Your app's own login signature, so nobody signs twice (below). |
| `context` | Sent with every bug report, to owners only: `{ version: '1.4.0' }`. |
| `noise` | Words common in your app, so "said already?" ignores them: `['nim', 'wallet']`. |
| `strings` | Override any text: `{ 'board.title': 'Ideas box' }`. Keys are in `src/i18n.ts`. |

Events: `pleasenobugs:posted` (`detail: { id, kind }`) and `pleasenobugs:close`.

## What your users see

Tapping **+** opens three tiles: **Report a bug**, **Share an idea** and
**Write a review**. A review is one to five stars and a few words, shown on the
board with the average on top, so people can see what others like about your
app. One review per wallet.

A bug or an idea can carry **a screenshot that only you see**: never the board,
not even its author. The widget shrinks it to a JPEG before sending and tells
the user, before they pick one, to check it shows nothing private. It is
deleted by itself when you mark the post Done or Not doing, or when the post is
thrown away.

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
  --pnb-accent-fill: var(--pnb-accent);  /* what buttons are painted with; may be a gradient */
  --pnb-on-accent: #fff;
  --pnb-danger: #d23b2f;
  --pnb-bug: #e5484d;  --pnb-idea: #e9a00b;  --pnb-review: #8b5cf6;
  --pnb-planned: #3e7bfa;  --pnb-done: #2f9e66;  --pnb-declined: #8b8d98;
  --pnb-star: #f5a524;
  --pnb-tile-bug: var(--pnb-surface);    /* the three tiles; may be gradients */
  --pnb-tile-idea: var(--pnb-surface);
  --pnb-tile-review: var(--pnb-surface);
  --pnb-tile-ink: var(--pnb-text);       /* the words on them */
  --pnb-sent: var(--pnb-bg);             /* behind "Feedback sent!" */
  --pnb-fab: var(--pnb-accent-fill);     /* the round floating button */
  --pnb-on-fab: var(--pnb-on-accent);    /* its glyph */
  --pnb-radius-panel: 16px;              /* the panel on a wide screen */
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
await client.post({ id: crypto.randomUUID(), kind: 'review', text: 'Love it', rating: 5 });
const shot = await client.shot(postId);      // owners only: the screenshot as a Blob
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
