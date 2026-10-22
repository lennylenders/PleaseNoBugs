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

## 2026-10-14: No hosted instance. Self-hosted only, and the maker keeps counts

Reverses "Open source and hosted, both". A hosted instance meant holding other
apps' feedback and their users' wallet addresses, which can count as personal
data, with everything that comes with that: a privacy statement, deletion
requests, and a breach that would be somebody else's users' problem. The owner
wants none of it, only to know how much feedback the tool has carried and how
much of it was acted on.

So every developer runs their own server and owns their own data. What made
hosting attractive, that many mini apps have no backend, is answered by a
"Deploy on Railway" button and by the server making its first project from
three environment variables (`PNB_PROJECT_*`), so there is no command line
between clicking and pasting a project id. Cost to the developer: their own
small Railway bill, about $1 to $1.50 a month at this size.

Shitti runs its own server like anybody else, and that server is also where the
counts arrive.

## 2026-10-14: Telemetry: four numbers per project, once a day, opt-out

Each server sends, once a day, every project's name with how many bugs and
ideas it has and how many of each are marked done (done is fixed for a bug,
built for an idea), plus a random installation id and the version. Never post
text, wallet addresses, display names, votes or origins. Hidden posts are not
counted.

- **On unless switched off** (`PNB_TELEMETRY=off`), and printed at start in
  full, so nobody learns what it sends by reading the source. Opt-in would have
  produced almost no numbers; never-off would have read as hidden collection in
  an open-source tool and been patched out.
- **Project names travel**, the owner's call, so the tool's reach can be shown.
  The public summary route answers totals only; the names of other people's
  apps are read on the collecting server with `pleasenobugs-server telemetry`.
- **Collected on Shitti's server** (`PNB_COLLECT=on`) rather than a service of
  its own: a hundred tiny reports a day cost nothing on a server that is
  running anyway.
- Anybody can post a report, so the totals are vanity numbers that a liar can
  inflate. Nothing odd is stored, and nothing depends on them.

## 2026-10-22: Railway is the quick start, Docker is the way out

"Self-hosted" should not quietly mean "on Railway". The same Dockerfile is
published as `ghcr.io/lennylenders/pleasenobugs` (amd64 and arm64, so a
Raspberry Pi works) by `.github/workflows/image.yml`, and `docker-compose.yml`
runs it behind Caddy, which fetches its own certificate: a VPS, Coolify or a
box at home is one `.env` and `docker compose up -d`. HTTPS is not optional,
because a mini app on `https://` may not call an `http://` server.

The image is published only for a version tag (`v0.1.0`), not on every push
to `main`: `:latest` is what self-hosters get when they update, so it has to be
a release the owner chose, and nothing goes public without a deliberate step.
The arm64 build installs a compiler in the build stage, because two of
`@nimiq/core`'s dependencies have no ready-made arm64 build. Neither has been
tried yet: there is no Docker on the owner's machine, so the first real build
is the first tag on GitHub.

Not done: a server without any company in between (Nostr relays, IPFS, the
chain). Deleting and moderating get close to impossible, one vote per wallet is
harder to hold, and wallet addresses would stay public forever, which is
exactly what "No hosted instance" was avoiding.

## 2026-10-22: The demo is pictures, not a site

The README shows the board in light and dark, an owner answering, and an
animation of a lookalike appearing while typing, all taken from the local
demo (`npm run demo -w pleasenobugs`). A demo site people can click through
was the alternative: more convincing, but another Railway service to pay for
and watch, and the demo signs on the visitor's behalf with test keys, so it
could never be anything but a toy. It can still come later.

The pictures use the current neutral look. When the look changes they need
taking again: with the demo running, `npm run screenshots -w pleasenobugs`
drives it with `puppeteer-core` and the local Chrome or Edge and rewrites
`docs/images` (the animation also needs ffmpeg). A dev dependency of the
widget only; nothing published carries it.

## Where it stands

Shitti moved onto PleaseNoBugs on 2026-10-15 and that move is finished: its
board is project `vxgxf5j6xz` on https://pleasenobugs-production.up.railway.app
(Railway service `pleasenobugs` in project `shitty-tasks`, volume on `/data`),
the old posts were imported, and Shitti's own copy of them is gone. Shitti's
branch `feature/pleasenobugs` was fast-forwarded into
`feature/task-input-redesign`, which is what Shitti's production runs.

Docs, demo and the preparation of the Deploy-on-Railway button were finished
on 2026-10-22: the README goes from nothing to a working board in three steps,
the server prints the lines to paste at every start, and the telemetry address
is set.

Next: publish. In order:

1. Make the GitHub repository public (under which account decides the image
   name, see Open).
2. Publish `@pleasenobugs/core`, `@pleasenobugs/server` and `pleasenobugs` to
   npm. The README's snippet loads `https://unpkg.com/pleasenobugs`, so nothing
   in it works before this.
3. Tag `v0.1.0`: that builds the container image. Set the package on GitHub to
   public once, and check that the arm64 build passed.
4. Make the Railway template from [railway-template.md](railway-template.md),
   deploy it once with test values, then put the button in the README and
   change its status line.
5. Point Shitti at the npm package instead of `file:../PleaseNoBugs`.

Then announce in the mini app competition community.

- The owner wants to be asked before every step that touches production.
- `DEFAULT_TELEMETRY_URL` is
  https://pleasenobugs-production.up.railway.app/telemetry, chosen over a
  domain of our own (2026-10-22) because it works today. Every published
  version sends there for as long as it runs: never rename, move or delete
  that Railway service, and keep `PNB_COLLECT=on` on it.
- The Railway CLI exists only in the agent's Bash, not in the Desktop app's
  Terminal panel. Git Bash rewrites `/data` style arguments: prefix with
  `MSYS_NO_PATHCONV=1`. `railway ssh` needs a registered key; the owner wants a
  temporary one each time, removed from Railway and `~/.ssh` afterwards.
- Shitti depends on the widget as `file:../PleaseNoBugs/packages/widget` until
  it is on npm. Rebuild the widget (`npm run build -w pleasenobugs`) before
  building Shitti.
- Commits here end with `Co-Authored-By: Claude Opus 5.5`; Shitti's CLAUDE.md
  asks for `Claude Opus 4.8`.

## Open

- Domain (`pleasenobugs.com` / `.dev`), not yet checked.
- Ask the Nimiq team whether they want to point mini app developers at it.
- The Railway template behind the Deploy button needs the repo public on GitHub.
  What goes in it is in [railway-template.md](railway-template.md).
- The container image is named after `lennylenders`, the git user here. If the
  repo goes public under another account or an organisation, change
  `docker-compose.yml`, the README and the entry above. After the first publish
  the package on GitHub is private: set it to public once.
