# Decisions

Why PleaseNoBugs is the way it is. Newest at the bottom. When a decision is
reversed, add a new entry rather than editing the old one, so the reasoning
that was tried survives.

## 2026-10-14: Where it comes from

Extracted from the feedback board in [Shitti](https://shitti.me), a Nimiq Pay
mini app, where it had been running since August 2026. Shitti will consume the
published package instead of its own copy, so there is one version and every
improvement lands in both.

## 2026-10-14: Open source and hosted, both

MIT licensed and self-hostable, plus a hosted instance where a developer needs
only a project id. Many mini apps have no backend of their own, so the hosted
route is what makes this easy; self-hosting is what makes it trustworthy.

Cost: the hosted instance means being responsible for uptime, abuse and other
apps' data.

## 2026-10-14: Identity is a Nimiq wallet

One vote per wallet, owners are wallet addresses, no accounts and no email.
Built behind an interface so another kind of login could be added, but Nimiq is
the only one.

## 2026-10-14: Proofs are scoped to a project and an origin

Shitti signs one fixed sentence, which is safe with one app. On a shared server
it would let any app reuse its users' signatures on every other board. The
signed message names the project and the origin. Cost: a user of an app that
already signed them in signs once more, the first time they post or vote.

## 2026-10-14: Reading is public

Anybody may read a board without signing. The signature is asked for at the
first post or vote, when the user has a reason to give it. Cost: everything
posted can be read outside the app. Authors and voters stay hidden.

## 2026-10-14: Headless client plus a web component

A framework-free client and matcher for developers who want their own UI, and a
`<please-no-bugs>` web component on top for everybody else. Mini apps are
written in React, Vue, Svelte and plain HTML; a React component would serve one
of the four.

## 2026-10-14: Names come from the app, or from the user

The host app may suggest a display name (it often knows one); the user can
change it; without one the post is anonymous. Stored per wallet per project.

## 2026-10-14: No notifications in v1

Owners see an "unseen since your last visit" count in the dashboard. Webhooks
(Discord, Slack) are the obvious next step and can be added without breaking
anything.

## 2026-10-14: Self-service project creation

A small dashboard: sign in with a wallet, enter a name and an origin, get a
project id and the snippet to paste. That wallet becomes the owner.

## 2026-10-14: Name

PleaseNoBugs. Funny, unique, free on npm. It also covers ideas, which the
tagline says. Not called "Nimiq ..." because it is not an official Nimiq
product, and `@nimiq` is Nimiq's own npm scope.

## 2026-10-14: SQLite through `node:sqlite`, Postgres later

The self-hosted store is one SQLite file on Node's built-in `node:sqlite`
rather than `better-sqlite3`, because a native module has to compile on
install and that is where self-hosters on Windows or slim containers give up.
Cost: Node 22.13+ only, and one "experimental" warning at start. Postgres comes
with the hosted instance. Every store passes the same contract tests
(`store.test.ts`), which is what "works" means for the next one.

## 2026-10-14: Any origin may call the API

CORS reflects every origin. Safe because nothing uses cookies: who you are is
the proof in the `Authorization` header, which no other page can borrow. Which
sites may post on which board is enforced on the proof itself, where a
developer gets a clear `origin_not_allowed` instead of a CORS error in the
console.

## 2026-10-14: Anonymous by default on the wire

A post with no `anon` field is anonymous. Shitti did the opposite (shown unless
`anon: true`), which was fine with one client written by the same person. With
many clients, a forgotten field should fail private.

## 2026-10-14: The widget is Preact in a shadow root

Preact because Shitti's board is React and ports almost line for line, at 4 kB.
A shadow root because the widget lives in other people's apps: their CSS must
not break it and its CSS must not leak. Everything is bundled in, so a host on
React 18, Vue or Svelte never reconciles a second copy of anything. 19 kB
gzipped for the script-tag build, three languages included.

## 2026-10-14: Neutral look, light and dark, themed by custom properties

Follows the phone's light/dark setting, one `accent` attribute, and every
colour is a `--pnb-*` property that is part of the public API. Shitti's look
ships as `theme="shitti"`. The owner wants to revisit the look; the properties
are what make that possible without touching the components.

Museo Sans Rounded is not used: it is licensed to the owner and cannot be
redistributed. The widget inherits the host app's font instead.

## 2026-10-14: Three ways to show it

`inline`, `floating` (a button in the corner, the "paste one line" route) and
`overlay` (what `open()` uses).

## 2026-10-14: Nimiq Pay built in, any other wallet through `signer`

Inside Nimiq Pay the widget signs through the injected provider by itself.
Elsewhere the app passes a signer, because it already has a wallet integration
and the Hub's popups are exactly what broke on phones in Shitti. Without one the
board is read-only, and says so only when somebody tries to write.

## 2026-10-14: The composer is one scrolling column

Shitti pinned a footer and then wrote a page about what phone keyboards do to
pinned footers. A widget meets keyboards it has never been tested against, so
it takes the arrangement with nothing to get wrong. Cost: the send button can
scroll out of view on a short screen.

## 2026-10-14: The bin is a button, not a swipe

Shitti hid deleting behind a swipe. A widget cannot teach gestures in somebody
else's app, so it is a visible button on your own posts.

## 2026-10-14: A quiet "Sign in" at the foot of the board

Reading never asks the wallet, so an owner opening the board saw no way to
answer until their first vote. A link under the list signs in without doing
anything else: owners get their controls, everybody else sees what is left of
their day before writing. Drawn only while signed out and only where a wallet
can be asked. Chosen over leaving it to the dashboard and over an attribute
telling the widget who the owner is.

## 2026-10-14: App logins, per project, off by default

Found while moving Shitti across: its browser-wallet users could not have
posted at all, since a second signature in a browser means a Hub popup and
Shitti already learned those strand people on phones. A project may now list
its app's own fixed login message, and the widget reuses the signature the app
already has. Nobody signs twice, in Nimiq Pay or a browser.

Cost: such a proof never expires, and anything that gets a user to sign the
app's message can post on that board as them. It can already use the app as
them with it, so the board adds no new risk; it is still the owner's explicit
choice, project by project. This walks back part of "proofs are scoped to a
project and an origin" for the projects that ask, and only for them.

## Open

- Domain (`pleasenobugs.com` / `.dev`), not yet checked.
- Ask the Nimiq team whether they want to point mini app developers at it.
- Where the hosted instance runs.
