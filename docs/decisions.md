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

## 2026-10-28: Reviews, with stars, in public

A third kind next to bugs and ideas: one to five stars and a few words. The
owner wants reviews **on the board**, so other users can see what people like
about an app, not only what is broken. That is why it is a kind of post and not
a private form: it gets the same anonymity, the same daily allowance, the same
owner reply and hiding.

- **One per wallet per project** (`409 reviewed`), so the average counts
  people. Changing your mind is throwing yours away and writing a new one;
  editing would have been one more route for little gain.
- **No status.** Nothing about an opinion gets planned or done, so a review
  stays `open` and the owner's sheet leaves the status out.
- **Seconding a review reads "Helpful"**, not "I want this too". Same vote,
  same count.
- **Telemetry does not count them.** It promises four numbers about bugs and
  ideas, and a fifth would be a change to what every server says it sends.
- **Existing projects get reviews on update.** Projects whose kinds are still
  the old default (`bug`, `idea`) get `review` added when an older SQLite file
  is opened (schema 2). Nobody could change kinds without the dashboard, so the
  old default was what they had, not what they chose. An app that does not
  want them sets `kinds="bug,idea"` on the widget, which also keeps reviews out
  of its list. Cost: an old widget meets a kind it does not know; `kind` is now
  documented as growing.

## 2026-10-28: Screenshots, for owners only, and not kept

Bugs and ideas may carry one screenshot. In a wallet app a screenshot easily
shows a balance or an address, so:

- **Owners only**, not even the author gets it back. It is read through its own
  route, never inside the board.
- **The widget says so before the picker opens**, and asks the user to check
  for anything private.
- **Redrawn on the phone** as a JPEG of at most 1600 pixels a side: small
  enough to send, one format whatever the phone used, and the photo's metadata
  (location, camera) stays behind.
- **Deleted when it has done its job**: the post marked Done or Not doing, or
  thrown away. A picture of somebody's screen should live no longer than the
  bug.
- **Checked to be an image**: the first bytes must match the type, and SVG is
  refused. Served with `nosniff` and a CSP that allows nothing.
- Stored in the SQLite file next to the posts, in their own table. 1 MB at
  most each; a busy board grows by a few megabytes, and settles back down as
  posts are answered. Cost: a self-hoster's disk now holds images their users
  sent, which is theirs to keep or not; `screenshots="off"` hides the button.

## 2026-10-28: Tiles first, and a moment that says it was sent

From the owner's old Figma design for a feedback widget. **+** now opens three
big tiles (bug, idea, review) instead of a compose screen with chips on top,
so the kind is the whole first question and nobody types a bug under "Idea"
because that chip happened to be selected. After posting, a full screen says
"Feedback sent!" for a moment and returns to the board; the toast it replaces
was easy to miss.

The design's colours are a theme, `vivid`, rather than the new default: Shitti
and anybody else already using the widget keep the look they chose. Two tokens
made it possible without touching components: `--pnb-accent-fill` (a button
may be a gradient while the accent stays a colour for outlines) and the
`--pnb-tile-*` set.

Left out of the design on purpose: an **email field**, because "anonymous, no
email" is the point of the board and the owner's reply already reaches the
author; and **bounties**, which were a mistake in the design.

## 2026-10-28: A panel in the corner on a wide screen, and a round button

From the owner's Figma design. On a phone the board still covers the screen,
since anything smaller is something to aim at with a thumb. From 640 pixels
wide, `floating` and `overlay` open a **panel in the bottom-right corner**
instead, where the button was: 375 wide like the design, growing with what is
in it up to 640 tall (the design's 509 fits the tiles but leaves the board two
posts), 24 pixels from the edges, over a dimmed page that closes it when
clicked, as Escape does. Decided in the stylesheet alone, so a window dragged
narrower changes over without anything re-rendering.

**The floating button is the design's round one**: a 40 pixel disc with two
speech marks, no words (the label is its accessible name and tooltip). Its
colour follows the theme through `--pnb-fab`: the design's dark blue in
`vivid`, the accent elsewhere, so it does not vanish on a dark app.

**It opens on the tiles**, as the design does, with "See the board" under
them. Somebody who taps a feedback button has come to say something; the board
is one tap further. `overlay` (what `open()` uses) still opens on the board,
since it is reached from the app's own "feedback" entry, which may well mean
"show me what others said".

## 2026-10-28: A website after all, with a board that lives in the page

The 2026-10-22 entry chose pictures over a demo site because a live demo
needed a server that signs for its visitors. A **`demo` attribute** removes
that: `<please-no-bugs demo>` talks to a board of sample posts in the page's
memory (`src/demo.ts`), in the language the board speaks. Voting, writing and
"Feedback sent!" all work, nothing is sent or stored, and a reload starts over.
The visitor is an ordinary signed-in user, never an owner. It is typed as the
real `Client`, so a change to the client it does not follow fails the build.
In the module build it is a chunk of its own that an app without `demo` never
downloads; the one-file script carries it (about 2 kB gzipped).

Options weighed: a pretend server inside the site (the widget unchanged, but
the site would have to mimic the API and could drift from it unnoticed), or
the existing demo server online (a server to pay for and watch, holding what
visitors type). Both lost to the attribute.

The site is `site/`: a landing page and a configurator, plain HTML, CSS and a
script, no framework and no dependency but the Mulish font, which it serves
itself so a visit tells Google nothing. Its style is the owner's Figma file
(nodes 6:5848 and 6:10595), not its dashboard: no bounties, no numbers that
would need a server. The configurator keeps every choice in the page and
nowhere else; the copied code is the only place a choice ends up. It hands
out `pleasenobugs@<version>` from unpkg, pinned, so a later release never
changes somebody's app unasked. The version is the widget's package.json,
filled in by `site/files.mjs`, so it cannot drift from the release.

The preview box gives the widget's fixed-position button and panel a box of
their own (`transform` on `.screen`), so they open in its corner as they
would in an app. "Preview full size" puts the same widget on the real page.

**Later the same week: one page, and the shitti look.** The owner found the
long landing page too much. The home page is now one screen (Figma node
48:9261): one line on what it is, one button to the configurator, and the
widget to try. The tabs lead on: How it works (the kinds of feedback and the
three modes), Customize, and GitHub. The code to paste lives only on
Customize, where developers make it. The whole site, configurator included,
is in the style of shitti.me, dark purple with turquoise buttons, and the
widget on it uses `theme="shitti"`. The design's font is Museo Sans Rounded,
served from the site like Mulish, not from Adobe Fonts, which would tell
Adobe of every visit. Its files are "all rights reserved", so they live in
`site/src/assets/fonts/`, which git ignores: a public repo would hand them
out to anyone. Where they are missing, as in the GitHub Pages build for now,
Mulish stands in. Putting them online needs a web licence, and a way to get
them into the build that does not go through the repo.

In the shitti theme an idea is purple and a review orange, like its star,
the owner's choice in Figma; Done is teal, Planned and Not doing a quiet grey.
One kind has one colour everywhere: the badge's dot, the tile, the icon in
the site's table, and the pill that names it.

**2026-10-29: the themes are named after what they look like.** That dark
purple is the website's own look now, so `shitti` became `pleasenobugs`, and
`vivid`, whose colours come from a Nimiq feedback design, became `nimiq`.
`vivid` was never released and is simply gone. `shitti` is in 0.1.0 and
0.1.1, so it stays as a second name for `pleasenobugs`: an app that has it
keeps its look on 0.2.0. The configurator offers PleaseNoBugs, Nimiq, Light
and Dark, and no longer Auto or a language: leaving `theme` out already
follows the phone, and `lang` already follows Nimiq Pay and the page, so
neither needs a choice there.

**2026-10-29: the configurator in steps.** All of it on one page was too much
at once. It is now one narrow column, after a small widget editor the owner
pointed at in Figma (node 68:11710): the widget on top, one card under it for
one part, and Back / Preview / Next. Eight steps in a fixed order: Settings,
Look, Round button (only when it is one), Board, Tiles, Write and send,
Feedback sent!, Code. Each step's part has a line around it, and tapping a
part of the widget jumps to its step instead of using it; Preview hands the
widget its taps back. Two or three colours per step, the rest of that part's
behind "More colours", so nothing the old page offered is gone. The Figma
screens are "Site · Customize · Step 1–8" on Page 3.

To put a part in view the widget gained `screen`, honoured only with `demo`:
it holds the round button, the tiles, the board, writing or "Feedback sent!",
which otherwise leaves by itself after 2.6 seconds. Options weighed: driving
the widget by tapping through it from the site (no change to the widget, but
"sent" would need a real post and still go away), or drawings of the screens
(no change either, but they would drift from the widget). The attribute is a
few lines and cannot touch a real board. The site also shortens the corner
panel to its box from outside, in the shadow root, since in an app the panel
is sized to the window and that is right there.

Hosted on GitHub Pages from this repo (https://lennylenders.github.io/PleaseNoBugs/),
no domain of our own for now. Published by `.github/workflows/site.yml` on a
version tag or by hand, never on a push to `main`: the code it hands out
loads that version from npm, so the site must not go out before the release.

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

Published 0.1.0 on 2026-10-23 to 2026-10-25, and 0.1.1 on 2026-10-26:

- **GitHub**: https://github.com/lennylenders/PleaseNoBugs, public. Before
  that, `docs/handoff.md` was cut out of the whole history, because it named
  the owner's wallet address. The history before the rewrite is in
  `PleaseNoBugs-backup-2026-10-22.bundle` next to the project folder, address
  and all: never publish it.
- **npm**: `@pleasenobugs/core`, `@pleasenobugs/server` and `pleasenobugs`,
  owned by the npm user `lennylenders` in the org `pleasenobugs`. unpkg and
  jsDelivr serve the widget. 0.1.0 went out under the owner's personal email,
  which npm prints in every version's metadata; on 2026-10-26 the account got
  a separate address and 0.1.1 was published from it. `pleasenobugs@0.1.0`
  and its `0.0.0-stage` placeholder were unpublished. The same for `core` and
  `server` was refused ("has dependent packages in the registry": after 72
  hours npm judges the package as a whole), so their 0.1.0 and 0.0.0-stage
  still show the old address. The owner chose to leave it at that rather than
  ask npm Support.
- **Container image**: `ghcr.io/lennylenders/pleasenobugs` `0.1.0`, `0.1` and
  `latest`, amd64 and arm64, public. The arm64 build passed on the first tag.
- **Railway template**: https://railway.com/deploy/PdvdtB, linked from the
  README's button. Tested end to end with a throwaway project, since deleted;
  see [railway-template.md](railway-template.md) for what that turned up.
- **Shitti** takes `pleasenobugs@^0.1.1` from npm: commits `8a74708` and
  `6afaed5` on `feature/task-input-redesign`, pushed, not deployed on purpose.
  The build is byte for byte what shitti.me already serves, so it ships with
  Shitti's next ordinary deploy.
- The container image is still `0.1.0` (it never carried the email). The next
  tag brings it level with npm.

Next: announce in the mini app competition community.

### Releasing a new version

1. Raise `version` in the three `package.json`s together, and the
   `@pleasenobugs/core` dependency of the other two with it.
2. `npm run build` and `npm test`.
3. From the Terminal panel: `npm.cmd publish -w @pleasenobugs/core`, then
   `-w @pleasenobugs/server`, then `-w pleasenobugs`. Each asks for a
   confirmation in the browser (two-factor, required by npm), and each shows
   as `0.0.0-stage` for a few minutes while npm checks it; unpkg follows a few
   minutes later.
4. Tag `vX.Y.Z` on the same commit and push the tag: that builds the image
   and publishes the website, which then hands out the new version. Pushing
   `main` alone builds nothing.

The website on this machine: `npm run build`, then `npm run site`
(http://localhost:5190). It shows this checkout's widget, not npm's. Before
the first publish, GitHub Pages has to be switched on once: Settings → Pages →
Source: "GitHub Actions".

### Working notes

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
- In the Terminal panel `npm` is blocked by PowerShell's execution policy:
  type `npm.cmd`. The panel's Run buttons open a new tab each time, so an
  answer typed afterwards lands in the wrong one.
- The project folder is in OneDrive, which keeps Git from deleting emptied
  object folders: `git gc --prune=now` stalls on "Deletion of directory
  failed". Harmless; unreachable objects are never pushed.
- npm prints the publishing account's email in every version's metadata,
  readable by anyone at registry.npmjs.org. Check the account's address before
  publishing anything new. A publish whose browser confirmation times out can
  still have gone through: npm then answers the retry with "Cannot publish
  over previously staged version".
- The template's test deploy left one extra installation, with no posts, on
  the collector's totals.
- Commits here end with `Co-Authored-By: Claude Opus 5.5`; Shitti's CLAUDE.md
  asks for `Claude Opus 4.8`.

## Open

- Domain (`pleasenobugs.com` / `.dev`), not yet checked.
- Ask the Nimiq team whether they want to point mini app developers at it.
- PleaseNoBugs' own server could move out of the `shitty-tasks` Railway
  project into one of its own (asked 2026-10-24). Not done: its generated
  domain is the telemetry address in every published version and the address
  Shitti's board uses, so it would mean moving the data and claiming the same
  `pleasenobugs-production` subdomain for the new service. A job of its own,
  at a quiet moment for Shitti.
