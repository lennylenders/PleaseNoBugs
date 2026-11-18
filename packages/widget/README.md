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
| `floating` | A round button in the corner. A tap grows it into the panel; closing shrinks it back into the button. Without the motion when the phone asks for less. |
| `overlay` | Over the page, right now. |

Each opens on the tiles (bug, idea, review), with the board one tap under
them. `start="board"` opens on the board instead.

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
| `start` | `tiles` (default) or `board`: what opens first. A `readonly` board is always the board. |
| `lang` | `en`, `nl`, `de`, or any code you supply `strings` for. Defaults to Nimiq Pay's language, then the page's. |
| `theme` | `auto` (follows the phone), `light`, `dark`, `pleasenobugs` (dark purple, the website's look), `nimiq` (the Nimiq Foundation's 2026 brand: navy on white, a gold round button) and `nimiq-dark` (the same on navy). Every theme has the same shapes: painted tiles with a glyph on them, the same badges; only the colours differ. `shitti` is the old name of `pleasenobugs` and still works. |
| `accent` | One colour, e.g. `#e84a5f`. The text on it picks black or white by itself. |
| `app-name` | What answers are signed with ("Shitti says"). Defaults to the project's name. |
| `name` | A display name you already know, offered when the user chooses to show theirs. |
| `kinds` | Which kinds to offer, of the ones your project takes: `bug,idea,review` by default. `kinds="bug,idea"` leaves reviews off the tiles and out of the list. |
| `screenshots` | Who sees screenshots on bugs and ideas. On the board for everyone by default, each one only after its author ticks that everyone may see it. `owners` keeps them for your eyes only; `off` leaves the "Add a screenshot" button out. An unknown value counts as `owners`. The project's own rule (`PNB_PROJECT_SCREENSHOTS` on the server) wins when it is stricter. |
| `names` | `off` leaves out "Show my name", so every post is anonymous. For a board on a public page. |
| `readonly` | The board to read and scroll through, nothing else: no **+**, no votes (the count still shows), no "Sign in", and it never asks a wallet or sends a proof, not even inside Nimiq Pay. Every post shows as anonymous and without its screenshot, whatever its author chose, because a read-only board is usually shown somewhere other than the app its authors wrote for. |
| `demo` | A board of sample posts in the page's memory, with no server: `<please-no-bugs demo>`. Voting and writing work, nothing is sent or stored, and a reload starts over. For trying the widget, or showing it off. `demo="owner"` is the same board as its owner sees it: answer, set a status and "Fixed in", write updates. |
| `screen` | With `demo` only: hold one screen in view, `button`, `tiles`, `board`, `write`, `sent` or `updates`. What the website's configurator uses to show the part you are changing. |

| Property | |
|---|---|
| `signer` | How to sign outside Nimiq Pay (below). |
| `appLogin` | Your app's own login signature, so nobody signs twice (below). |
| `context` | Sent with every bug report, to owners only: `{ version: '1.4.0' }`. |
| `noise` | Words common in your app, so "said already?" ignores them: `['nim', 'wallet']`. |
| `strings` | Override any text: `{ 'board.title': 'Ideas box' }`. Keys are in `src/i18n.ts`. |
| `samples` | With `demo` only: the posts the demo board starts with, instead of its own, and no updates: `[{ kind: 'idea', text: 'Pin my contacts', votes: 12 }]`. |

Events: `pleasenobugs:posted` (`detail: { id, kind }`) and `pleasenobugs:close`.

## What your users see

Tapping **+** opens three tiles: **Report a bug**, **Share an idea** and
**Write a review**. A review is one to five stars and a few words, shown on the
board with the average on top, so people can see what others like about your
app. One review per wallet.

A bug or an idea can carry **a screenshot, shown on the board** under the
post, so everybody can see what is meant. Before picking one the user reads
that everyone will see it and should check it for a balance, an address or a
name; after picking, **nothing is sent until they tick "I checked it: everyone
may see this screenshot"** under the picture. The widget redraws it as a JPEG
before sending, which leaves the photo's location and camera details behind.

You see every screenshot on the page where you answer a post, and can **take
one off the board** there while the post stays up, or hide the whole post. A
screenshot is deleted by itself when you mark the post Fixed, Done or Not doing, or
when the post is thrown away. Taking one off stops it being shown; it cannot
take it back from anybody who already saved it.

**Approving first.** On a project made with `PNB_PROJECT_APPROVE=on`, a new
post waits until an owner approves it. Its author sees it on the board marked
"Waiting for approval", and "Feedback sent!" says it shows once approved;
nobody else sees it yet. Owners see it too, and approve it on the page where
they answer it. Your own posts as an owner never wait.

With `screenshots="owners"` they stay yours alone, never the board and not
even their author: the warning says so instead, and there is nothing to tick.
Any screenshot sent without that tick keeps that promise, whatever you change
later.

If your page has a Content Security Policy, screenshots on the board load as
plain images from your server, so `img-src` needs your server next to
`connect-src`.

**Fixed, and where.** When you mark a bug **Fixed** or an idea **Done**, the page asks
for the version it shipped in and a link to the fix, a commit, a pull request
or a release. Both are optional; only github.com and gitlab.com links are
accepted. The card then says "Fixed in 1.4.2 · View on GitHub" (or GitLab)
for everybody,
and whoever reported it gets a note on top of their board, "Your bug is fixed
in 1.4.2", until they close it. Which notes were closed is remembered in the
browser, as post ids and nothing else.

**Updates.** The megaphone at the top of the board opens the Updates page:
what changed in your app, newest first, each one opening its page on GitHub
or GitLab.
Anybody can read it, signed in or not. You write one with **+** there: a
title, a version, a GitHub or GitLab link, a few lines, and which open bugs and ideas
it fixes. Those you tick are marked Fixed (bugs) or Done (ideas) with that version and link, and their
authors get the note. Until you write the first one, only you see the button.

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
  --pnb-bug: #e5484d;  --pnb-idea: #8b5cf6;  --pnb-review: #e9a00b;
  --pnb-planned: #8a8fb8;  --pnb-done: #21bca5;  --pnb-declined: #8a8fb8;
  --pnb-on-dot: #fff;                    /* the glyph on a chip's dot; or per kind and status: */
  --pnb-on-bug: var(--pnb-on-dot);       /* --pnb-on-idea, -review, -planned, -done, -declined */
  --pnb-star: #f5a524;
  --pnb-filter: var(--pnb-text);         /* the chosen filter, and the chosen status in your answer sheet */
  --pnb-on-filter: var(--pnb-bg);        /* its words: set both, as they are not picked for you */
  --pnb-tile-bug: var(--pnb-bug);        /* the three tiles; may be gradients */
  --pnb-tile-idea: var(--pnb-idea);
  --pnb-tile-review: var(--pnb-review);
  --pnb-tile-ink: #fff;                  /* the words on them */
  --pnb-tile-ink-bug: var(--pnb-tile-ink); /* the words on one tile (-idea, -review too) */
  --pnb-tile-dot-bug: transparent;       /* a disc behind each tile's glyph (-idea, -review too) */
  --pnb-tile-glyph-bug: var(--pnb-tile-ink-bug); /* and the glyph's colour (-idea, -review too) */
  --pnb-tile-icon: 44px;                 /* the box the glyph sits in */
  --pnb-choose-title: var(--pnb-text);   /* the question above the tiles */
  --pnb-title-board: var(--pnb-text);    /* the title in the board's bar */
  --pnb-title-write: var(--pnb-text);    /* the title above the form */
  --pnb-card: var(--pnb-surface);        /* the posts and the rating on the board, */
  --pnb-card-text: var(--pnb-text);      /* their words, */
  --pnb-card-quiet: var(--pnb-text-quiet); /* and their names, dates and counts */
  --pnb-field: var(--pnb-surface);       /* every field you type in (form, search, answer, update), */
  --pnb-field-text: var(--pnb-text);     /* what is typed in it, */
  --pnb-field-quiet: var(--pnb-text-quiet); /* its hint while empty, */
  --pnb-field-line: var(--pnb-line);     /* and the line round it */
  --pnb-news: var(--pnb-surface-2);      /* the note on top of the board ("... answered your idea"), */
  --pnb-news-line: var(--pnb-accent);    /* its line, */
  --pnb-news-text: var(--pnb-text);      /* its words, */
  --pnb-news-link: var(--pnb-accent);    /* its link, */
  --pnb-news-quiet: var(--pnb-text-quiet); /* and its small words and close */
  --pnb-filter-btn: var(--pnb-surface);  /* the Filter button: its ground, */
  --pnb-filter-btn-text: var(--pnb-text); /* its word, */
  --pnb-filter-btn-line: var(--pnb-line); /* and its line */
  --pnb-bar-icon: var(--pnb-text);       /* the icons in every bar: close, back, updates, new post */
  --pnb-order: var(--pnb-sunken);        /* behind Top / New, */
  --pnb-order-text: var(--pnb-text-quiet); /* and the word not chosen */
  --pnb-vote: var(--pnb-surface-2);      /* the vote button, */
  --pnb-vote-text: var(--pnb-card-text); /* its count, */
  --pnb-vote-on: var(--pnb-accent);      /* a vote you gave, */
  --pnb-on-vote-on: var(--pnb-on-accent); /* and its count */
  --pnb-choose-link: var(--pnb-text-quiet); /* "See the board" under the tiles */
  --pnb-form-quiet: var(--pnb-text-quiet); /* the small words in a form */
  --pnb-switch: var(--pnb-surface-2);    /* a switch when off, */
  --pnb-switch-line: var(--pnb-line);    /* its line, */
  --pnb-switch-knob: var(--pnb-text-quiet); /* its knob, */
  --pnb-switch-on: var(--pnb-accent);    /* the switch when on, */
  --pnb-on-switch-on: var(--pnb-on-accent); /* and its knob */
  --pnb-shot-line: var(--pnb-line);      /* the line round "Add screenshot" */
  --pnb-order-on: var(--pnb-surface);    /* the chosen half of Top/New, */
  --pnb-on-order: var(--pnb-text);       /* and its words */
  --pnb-sent: var(--pnb-bg);             /* behind "Feedback sent!" */
  --pnb-sent-title: var(--pnb-text);     /* its title, */
  --pnb-sent-note: var(--pnb-text-quiet); /* its small words and "Back to the board", */
  --pnb-sent-check: var(--pnb-done);     /* and the disc behind its tick */
  --pnb-on-sent-check: #fff;            /* the tick itself */
  --pnb-raise: none;                     /* a filled button's shadow; `pleasenobugs` raises it */
  --pnb-raise-pressed: none;             /* its shadow while pressed */
  --pnb-raise-sink: 0px;                 /* how far it sinks when pressed */
  --pnb-fab: var(--pnb-accent-fill);     /* the round floating button */
  --pnb-on-fab: var(--pnb-on-accent);    /* its glyph */
  --pnb-fab-shadow: var(--pnb-shadow);   /* its shadow, */
  --pnb-fab-shadow-pressed: var(--pnb-fab-shadow); /* pressed, */
  --pnb-fab-squeeze: 0.94;               /* and how small it gets pressed */
  --pnb-radius-panel: 16px;              /* the panel on a wide screen */
  --pnb-radius: 8px;
  --pnb-radius-sheet: 16px;
  --pnb-radius-pill: 999px;  /* filters, chips, votes, Top/New, buttons */
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
const shot = await client.shot(postId);      // the screenshot as a Blob: on the board, or yours as an owner
const src = client.shotUrl(postId);          // a board screenshot's address, for an <img>
const news = await client.updates();         // what changed in the app; never asks the wallet
// The conversation under a post: the app any time, its author right after the app.
await client.say(postId, { id: crypto.randomUUID(), text: 'A Pixel 7, every time.' });
await client.editMessage(postId, messageId, { text: 'A Pixel 8, every time.' });   // your last, until answered
await client.unsay(postId, messageId);
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
