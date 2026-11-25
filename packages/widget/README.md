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
| `start` | `tiles` (default) or `board`: what opens first. A `readonly` board is always the board, and so is the board for somebody not signed in outside Nimiq Pay: they read first, and the **+** asks them to sign in ("Sign in to share feedback") before the tiles. |
| `theme` | `nimiq` (default): the Nimiq Foundation's 2026 brand, navy on white with a gold round button. `nimiq-dark`: the same on navy. |
| `lang` | The language of your `strings`, so dates follow it: `nl` writes "14 sep". English by default. |
| `app-name` | What answers are signed with ("My app says"). Defaults to the project's name. |
| `name` | A display name you already know, filled in for a user who has not chosen one on this board yet. |
| `kinds` | Which kinds to offer, of the ones your project takes: `bug,idea,review` by default. `kinds="bug,idea"` leaves reviews off the tiles and out of the list. |
| `screenshots` | Who sees screenshots on bugs and ideas. On the board for everyone by default, each one only after its author ticks that everyone may see it. `owners` keeps them for your eyes only; `off` leaves the "Add a screenshot" button out. An unknown value counts as `owners`. The project's own rule (`PNB_PROJECT_SCREENSHOTS` on the server) wins when it is stricter. |
| `names` | `off` leaves out the name field and the "Post anonymously" switch: every post is anonymous, with no name and no identicon. |
| `readonly` | The board to read and scroll through, nothing else: no **+**, no votes (the count still shows), no "Sign in", and it never asks a wallet or sends a proof, not even inside Nimiq Pay. Every post shows as anonymous and without its screenshot, whatever its author chose, because a read-only board is usually shown somewhere other than the app its authors wrote for. |
| `demo` | A board of sample posts in the page's memory, with no server: `<please-no-bugs demo>`. Voting and writing work, nothing is sent or stored, and a reload starts over. For trying the widget, or showing it off. `demo="owner"` is the same board as its owner sees it: answer, set a status and "Fixed in", write updates. With a `server`, a demo still keeps its posts in the page and asks that server only for the identicons. |
| `screen` | With `demo` only: hold one screen in view, `button`, `tiles`, `board`, `write`, `sent` or `updates`. What the website's Make it yours uses to show each part. |

| Property | |
|---|---|
| `signer` | How to sign outside Nimiq Pay (below). |
| `appLogin` | Your app's own login signature, so nobody signs twice (below). |
| `context` | Sent with every bug report, to owners only: `{ version: '1.4.0' }`. |
| `noise` | Words common in your app, so "said already?" ignores them: `['nim', 'wallet']`. |
| `strings` | Override any text, or put the whole board in your app's language: `{ 'board.title': 'Ideas box' }`. The widget ships in English; the keys and the English are in `src/i18n.ts`. |
| `samples` | With `demo` only: the posts the demo board starts with, instead of its own, and no updates: `[{ kind: 'idea', text: 'Pin my contacts', votes: 12 }]`. |

Events: `pleasenobugs:posted` (`detail: { id, kind }`) and `pleasenobugs:close`.

## What your users see

Tapping **+** opens three tiles: **Report a bug**, **Share an idea** and
**Write a review**. A review is one to five stars and a few words, shown on the
board with the average on top, so people can see what others like about your
app. One review per wallet.

A post goes out with **the user's wallet identicon and a name** they fill in
once per board, never their address. Changing the name changes it on their
earlier posts too. **"Post anonymously"** leaves both off. The identicon is
drawn by your PleaseNoBugs server (`/v1/identicons/…`), like screenshots, so
the page needs that server in its `img-src`.

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
properties cross that boundary on purpose and are the theming API. The
defaults below are the `nimiq` look; `nimiq-dark` sets the colours again on
navy:

```css
please-no-bugs {
  --pnb-bg: #ffffff;            /* the page */
  --pnb-surface: #fafaf8;    /* a card */
  --pnb-surface-2: #f2f3f4;  /* a chip or field inside a card */
  --pnb-sunken: #f2f3f4;     /* the Top/New trough */
  --pnb-line: #e6e6e9;
  --pnb-text: #040724;
  --pnb-text-quiet: #686a7c;
  --pnb-accent: #040724;
  --pnb-on-accent: #ffffff;
  --pnb-danger: #cb0015;
  --pnb-bug: #cb0015;  --pnb-idea: #ffb700;  --pnb-review: #4f5166;
  --pnb-planned: #ffc758;  --pnb-done: #040724;  --pnb-declined: #9b9ca7;
  --pnb-on-dot: #ffffff;                    /* the glyph on a chip's dot; or per kind and status: */
  --pnb-on-bug: var(--pnb-on-dot);       /* --pnb-on-idea, -review, -planned, -done, -declined */
  --pnb-star: #ffb700;
  --pnb-filter: var(--pnb-text);         /* the chosen filter, and the chosen status in your answer sheet */
  --pnb-on-filter: var(--pnb-bg);        /* its words: set both, as they are not picked for you */
  --pnb-tile-bug: var(--pnb-bug);        /* the three tiles; may be gradients */
  --pnb-tile-idea: var(--pnb-idea);
  --pnb-tile-review: var(--pnb-review);
  --pnb-tile-ink: #ffffff;                  /* the words on them */
  --pnb-tile-ink-bug: var(--pnb-tile-ink); /* the words on one tile (-idea, -review too) */
  --pnb-tile-dot-bug: transparent;       /* a disc behind each tile's glyph (-idea, -review too) */
  --pnb-tile-glyph-bug: var(--pnb-tile-ink-bug); /* and the glyph's colour (-idea, -review too) */
  --pnb-tile-icon: 44px;                 /* the box the glyph sits in */
  --pnb-choose-title: var(--pnb-text);   /* the question above the tiles */
  --pnb-title-board: var(--pnb-text);    /* the title in the board's bar */
  --pnb-title-write: var(--pnb-text);    /* the title above the form */
  --pnb-card: #ffffff;        /* the posts and the rating on the board, */
  --pnb-card-text: var(--pnb-text);      /* their words, */
  --pnb-card-quiet: var(--pnb-text-quiet); /* and their names, dates and counts */
  --pnb-field: #f2f3f4;       /* every field you type in (form, search, answer, update), */
  --pnb-field-text: var(--pnb-text);     /* what is typed in it, */
  --pnb-field-quiet: var(--pnb-text-quiet); /* its hint while empty, */
  --pnb-field-line: var(--pnb-line);     /* and the line round it */
  --pnb-news: var(--pnb-surface-2);      /* the note on top of the board ("... answered your idea"), */
  --pnb-news-line: var(--pnb-accent);    /* its line, */
  --pnb-news-text: var(--pnb-text);      /* its words, */
  --pnb-news-link: var(--pnb-accent);    /* its link, */
  --pnb-news-quiet: var(--pnb-text-quiet); /* and its small words and close */
  --pnb-filter-btn: #ffffff;  /* the Filter button: its ground, */
  --pnb-filter-btn-text: var(--pnb-text); /* its word, */
  --pnb-filter-btn-line: #cdcdd3; /* and its line */
  --pnb-bar-icon: var(--pnb-text);       /* the icons in every bar: close, back, updates, new post */
  --pnb-order: var(--pnb-sunken);        /* behind Top / New, */
  --pnb-order-text: var(--pnb-text-quiet); /* and the word not chosen */
  --pnb-vote: #f2f3f4;      /* the vote button, */
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
  --pnb-sent-check: #040724;            /* and the disc behind its tick */
  --pnb-on-sent-check: #ffffff;         /* the tick itself */
  --pnb-fab: #ffb700;                    /* the round floating button */
  --pnb-on-fab: #040724;                 /* its glyph */
  --pnb-fab-shadow: var(--pnb-shadow);   /* its shadow, */
  --pnb-fab-shadow-pressed: var(--pnb-fab-shadow); /* pressed, */
  --pnb-fab-squeeze: 0.94;               /* and how small it gets pressed */
  --pnb-radius-panel: 16px;              /* the panel on a wide screen */
  --pnb-radius: 10px;
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

The project has to accept that message first: set `PNB_PROJECT_LOGIN_MESSAGE`
on your server (on a server that already runs, set it and restart; with one
project it is added to that one), or use the dashboard or
`create-project --login-message`. If your login message changes every time,
because it carries a date or a random code, give its fixed start followed by
`*`, like `Sign in to My app*` (at least 12 characters before the `*`). Set
`appLogin` to `null` when the user logs out of your app.

This is how a mini app in Nimiq Pay, or a website with its own wallet login,
lets its users post and vote without signing anything again. Without it, the
widget asks the wallet to sign once by itself, at the first vote or post:
inside Nimiq Pay a short confirmation, kept for a month; in a browser through
the Nimiq Hub, kept until the tab closes.

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

With a signer and outside Nimiq Pay, the board offers **"Sign in with Nimiq"**
on top until the user has signed in, since signing opens a wallet window
there. Without a signer outside Nimiq Pay, the board is read-only and says
"Sign in with your Nimiq wallet to post and vote" when somebody tries to post.
On a website with its own wallet login, that is the moment to hand the login
over with `appLogin` (above): set it once the user has signed in to your site,
and back to `null` when they sign out.

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
