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

*"Owners only" is no longer the default: see 2026-10-29. The rest stands.*

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
one part, and Back / Preview / Next. Eight steps (later seven, see below) in a fixed order: Settings,
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

After trying it, the owner changed four things the same day. On a wide
screen the steps are on the left and the widget on the right, where it stays
while the left scrolls; on a phone it is still one column. While choosing,
the widget does not scroll, and tapping a part of the step on screen opens
that part's colour picker (or its words: the board's title, the question
above the tiles, "Feedback sent!") instead of only showing where it is. The
app name is gone from the steps: it showed up in the notes under the tiles,
which the design does not have. And the accent is no longer a colour of its
own in Look: it is the round button's colour in step 3, and the send button's
in step 6, the same value in both (step 6 alone when there is no round
button). Nimiq's round button is dark blue whatever the accent, so there the
configurator also writes `--pnb-fab`.

The `pleasenobugs` theme's tiles are now the design's: each painted in its
kind's colour, a white glyph without a disc, and no note under the name
unless there is something to say (a review already written). `shitti`, its
old name, gets the same.

The three kind glyphs are the design's too, path for path: a mark of alarm
for a bug, a sprout for an idea, a star for a review. They replace the old
line drawings everywhere a kind shows (tiles, badges, the compose screen),
in every theme, so a kind looks the same where you pick it and where it
lands. Subtext on the site (leads, hints, card text, the footer) is white at
70%, one token, `--sub`.

A second round, also the same day. **A tap in the widget never changes the
step any more**: only a part of the step you are on does something, so the
order the steps were given in is the order you go through them. Look is gone.
The steps are now Settings, Feedback button (the round one, only when it is one), Tiles, Board,
Write and send, Feedback sent!, Code: seven, or six without the button.

**The configurator offers no themes for the first version.** A theme picker
(circles of each theme's tile colours, with "Customize" last) was built and
dropped the same hour: the owner wants PleaseNoBugs' own colours side by
side, each one changeable, and nothing to choose between first. The code it
hands out still says `theme="pleasenobugs"`, so an app gets those colours and
not the widget's light default. The widget keeps its other themes for anyone
who sets one by hand. Tiles shows the three tile colours and the widget's
background, which is set there because most of it shows there, and no longer
in Board, which instead lets you change the words above your answers
("{app} says").

**Every part of the widget can be tapped, and opens its colour family.** A
family is one custom property and everything painted with it: tapping the
answer box opens Background, which is the panel too; the chosen Top/New tab
opens Cards; the toggle opens Accent, which is also the send button. The
owner chose families over a colour of its own for each part (which would have
meant new widget properties and many more dots). So each step lists every
family its screen shows, two to four up front and the rest behind "More
colours", and a family can be in more than one step: Background is in Tiles,
Board and Write. Each has a name and a line saying where it shows, under the
dots when you tap or point at one, and next to it in the longer list. A
kind's colour is one family for its tile and its badge (`--pnb-bug` and so
on, which the tiles follow), so changing a tile changes the dot next to "Write
a review" too. A tap on the dim page around the panel opens nothing: that is
the app's. Checked by tapping every part on every screen, changing the colour
it opened, and seeing that part change.

While choosing, the writing field is a little lower in the box, so the whole
writing screen, field to send button, fits at once with a line around it.

**Every theme now has the `pleasenobugs` shapes**: painted tiles with a white
glyph and no note, the same badges, the same kind colours (a bug red, an idea
purple, a review orange, Done teal, the rest grey). Light and Dark had an
idea in orange and a review in purple, the other way round, which made the
same kind look like two. Nimiq keeps its own colours and gradients. The
status glyphs (Planned, Done, Not doing) are the design's as well, and badge
words are extra bold, as there.

Hosted on GitHub Pages from this repo (https://lennylenders.github.io/PleaseNoBugs/),
no domain of our own for now. Published by `.github/workflows/site.yml` on a
version tag or by hand, never on a push to `main`: the code it hands out
loads that version from npm, so the site must not go out before the release.

## 2026-10-29: Screenshots on the board, after a tick

Reverses the default of 2026-10-28. The owner wants everybody who reads the
board to see the screenshot under a post, so it is plain to all what is
meant, not only to whoever fixes it. The risk that made it owners-only has not
gone away, so it is answered on the phone, before sending:

- **Warned before picking**: "Everyone who views the board sees it", what to
  look for (a balance, an address, a name), and that an address on it shows
  it was you even when you post anonymously. That last line is there because
  a screenshot is the easiest way to undo the anonymity the board promises.
- **A tick under the picture**, "I checked it: everyone may see this
  screenshot", asked again for every picture. Sending stays off until it is
  ticked or the picture removed, so nobody posts one by tapping past a note.
  Chosen over the warning alone, which people read once and then stop seeing.
- **The server only shows what the author agreed to.** A screenshot carries
  `board: true` only when the widget asked; without it (an older widget, a
  script, `screenshots="owners"`) it stays the owners', and **no owner can
  put it on the board later**. Stored as two flags, what the author agreed and
  whether an owner took it off, so the yes cannot be changed after the fact.
  Every screenshot already stored was sent under "only the owners see it" and
  keeps that (schema 3). None had been released: screenshots were still only
  on this machine. The rule is there for the day somebody runs a build from
  between the two.
- **Owners can take one off the board** in the sheet where they answer, while
  the post stays up, and put it back. Hiding the post takes its screenshot
  with it. Served with `no-store` so that works for the next person who
  looks, and `noindex`. Neither takes it back from anybody who already saved
  it, which the widget's README says.
- **On the card, small, loaded when scrolled near**; a tap opens it whole.
  Chosen over only a mark that opens it, which would leave the point (seeing
  what is meant) one tap away on every post. A board screenshot needs no
  proof, so it is a plain `<img>`: an app with a Content Security Policy needs
  its server in `img-src`.
- **The app's version (`context`) stays owners only.** It helps reproduce a
  bug and tells a reader nothing.
- **Per app**: on the board is the default. `screenshots="owners"` keeps the
  2026-10-28 behaviour and its warning; `off` still leaves the button out. An
  unknown value counts as `owners`, so a typo fails private.
- **Still deleted** when the post is marked Done or Not doing, or thrown away.

What becomes public, then, is what is in the picture and nothing else: no
author address, no context, and none of the photo's metadata, which the
redraw on the phone leaves behind (the widget never falls back to sending the
original). A picture can still show other people (names and addresses in a
transaction list, a message in a notification), who never agreed to anything;
the warning names a name for that reason. A self-hoster, and the owner for
Shitti's board, now serves images their users chose to make public, which a
privacy statement may need to mention.

## 2026-10-29: Later, other apps' boards on the site. The frame now

The owner wants, one day, the website to show the feedback of every app that
uses PleaseNoBugs, Shitti first, so people can scroll through it and see
which app hears what. Not switched on yet; what it needs is built now, so it
ships in 0.2.0 and turning it on later needs no new widget.

- **`readonly` on the widget.** The board to read and nothing else: no **+**,
  no votes (the count shows), no "Sign in". It reads as a stranger, with no
  signer, no app login and no remembered proof, even inside Nimiq Pay, so a
  server never learns who looked. **Every post anonymous and no screenshots**,
  whatever the author chose (`forReaders` in `readonly.ts`): a name or a
  picture was agreed to for that app's board, not for a page somewhere else.
  Hidden posts, and the app's context, never reach a stranger anyway; they are
  dropped again so nothing depends on that.
- **Listed by asking, never found.** `site/src/apps.json`, empty, takes
  `{ name, server, project, url }` per app, added by its developer in a pull
  request the owner accepts. Every server is somebody else's, and the
  telemetry deliberately never says where one is; a switch on the server that
  reported its address was the alternative, and would have changed what every
  server sends, which the review count was already refused for.
- **Read by the visitor's browser, from each app's own server**
  (`site/src/assets/apps.js`). The site keeps no copy, which is what "No
  hosted instance" was about. Cost: each app's server sees the visitors'
  addresses, and an app whose server is down is simply missing.
- **Off until a page has `<div data-pnb-apps>`** and the list is not empty.
  No page has one.

Before switching it on: whether search engines may index the boards
(`noindex`, or not), and telling Shitti's users, in Shitti, that their
feedback can be read on the PleaseNoBugs site too. Shitti is not on the list
until then.

## 2026-10-29: The home page's board is real

The owner wants visitors to see that the widget works, by using it: the board
on the home page is now PleaseNoBugs' own, where people say what they think
of it. The configurator stays a demo, because it needs `screen`, and trying
colours should not post anything. Reverses, for the home page only, "a board
that lives in the page" of 2026-10-28.

- **Its own server**, a Railway service in a project of its own, not
  Shitti's. A public page draws spam, and Shitti's service is also the
  telemetry address, which nothing may put at risk. About $1 to $1.50 a
  month. The site reads it from `site/board.json`, filled in once the server
  exists; `site/build.mjs` refuses to build without it, so the site cannot go
  out with a board that is not there. On this machine the home page talks to
  `site/board.mjs` instead (`npm run site:board`): the same rules, in memory.
- **A guest key, for visitors without a wallet** (`site/src/assets/guest.js`).
  The browser makes an Ed25519 key, keeps it in `localStorage` and signs the
  way the Keyguard does; to the server it is an ordinary Nimiq address, so the
  server did not change for it. Checked against Nimiq's own address
  derivation and a real server (`site/guest.test.ts`). Only on this website,
  never in the npm package: an app's board counts wallets, and a way around
  that for every app would undo it. Cost: one vote and five posts a day per
  *browser*, not per person; a private window is somebody new. Inside Nimiq
  Pay the wallet signs as anywhere.
  Options weighed: the Nimiq Hub for everybody (most visitors have no Nimiq
  account, and its popups are what Shitti learned to avoid on phones), and a
  new kind of guest login on the server (more code, nothing gained).
- **Approved before anybody sees it** (`rules.approve`, new in the server).
  The owner sees no notification, so without it rubbish would sit on the home
  page until somebody looked. A waiting post is shown to its author, marked
  "Waiting for approval", and to the owners, who approve it in the sheet where
  they answer. Stored as its own flag (schema 4), not as `hidden`, since the
  author must see one and not the other. It counts against the day's posts.
- **No names, no screenshots.** `names="off"` leaves "Show my name" out, and
  the project's `rules.screenshots` is `off`, which the server enforces: on a
  public page anybody with a script could otherwise put any picture on the
  home page, whatever the widget's attribute says. The widget follows the
  stricter of its attribute and the project's rule.
- **Fewer addresses anywhere.** Rate limits now count a hash of the IP
  address with a secret that lives only in the running process, and the log
  says which limit tripped but no longer for whom. A server may also cap
  posts per IP address a day (`PNB_POSTS_PER_IP_DAY`), off by default because
  behind a phone network many people share one address; the site's server
  sets it.
- **The owner signs in with `#owner`.** The home page with `#owner` in its
  address uses the Nimiq Hub (`@nimiq/hub-api` 1.15.0 from jsDelivr, loaded
  only then), so the owner can approve and answer from a computer with their
  real wallet. Without it the page never loads the Hub.

Both widgets on the home page, the one in the page and the round button, are
the same real board. The footer no longer says the site stores nothing: what
you post goes to that server, without a name, and the guest key stays in the
browser.

## 2026-10-31: Fixed, with a link to GitHub or GitLab, and an Updates page

The owner wants a board to show what came of what people reported: an app's
maker marks a bug fixed in the widget, and everybody can see what changed in
the app. Designed in Figma first (Page 3, "Widget · Fixed and updates"),
built after the owner approved it. For 0.3.0: 0.2.0 was already on npm.

- **Done gets "Fixed in"**: a version and a link, both optional, in the
  sheet where an owner answers. The card says "Fixed in 1.4.2 · View on
  GitHub" for everybody. Stored on the post (`fix`, schema 5), and gone when
  the post moves away from done, so a fix never sits under something planned.
- **GitHub and GitLab links only**, the owner's choice: a link on a board is
  something an app's users are invited to tap, and "it goes to the code" is a
  promise every board keeps whoever runs it. First github.com alone; the
  owner added gitlab.com the same day, for makers who keep their code there.
  `cleanCodeLink` in core, checked by the server, the sheets, and again where
  a link is drawn, which shows the site's own mark and name ("View on
  GitLab"). Weighed: any https link (an own changelog, a GitLab on the
  maker's own server), which would have made every board a place to put any
  link at all.
- **The reporter hears it on their own board.** The owner was told the widget
  showed answers already; it did not, only the API had them (`/answers`). So
  the board now shows a note on top, "Your bug is fixed in 1.4.2", to whoever
  wrote it, until they close it. Worked out from the board itself (`mine`,
  `status`), so it costs no request; which notes were closed is kept in
  `localStorage` as post ids. `/answers` now carries `status` and `fix` too,
  for apps that show news themselves. No email, no push.
- **Updates are written by the owner, in the widget**: a title, a version, a
  GitHub or GitLab link (required: tapping one goes there), a few lines, and the
  bugs and ideas it fixed. Weighed: reading GitHub Releases (no double work,
  but only for public repositories, and a server fetching GitHub for every
  board) and a page of done posts only (nothing for a change nobody reported).
- **Ticking a post in an update marks it done**, with the update's version and
  link, and its author gets the note. One write instead of answering each post
  again. Deleting an update leaves those posts done.
- **The page is public** and opens from a megaphone at the top left of the
  board, beside Close when there is one. The button shows once there is an
  update, and always to owners, who write the first. The board says how many
  there are (`updates` on `BoardRead`), so the button needs no request of its
  own; the page itself is read when it opens.

## 2026-10-31: Museo Sans Rounded is the project's font, on the published site too

The site showed Museo Sans Rounded only on the owner's computer: its files
were kept out of git (2026-10-28) because they say "All rights reserved", so
GitHub Pages fell back to Mulish. The owner says no licence is needed for
them and asked for them online, having been told that the files would then
be downloadable by anyone and stay in the public history for good. So
`site/src/assets/fonts/` (weights 500, 700 and 900, the ones the site uses)
is in git now and published with the site. The owner then made it the
project's font: Mulish is gone from the site and from the repo's
dependencies, and the system's font stands in only while it loads. The demo
page (`packages/widget/demo`) uses it as well, from the same folder.

- **The widget is unchanged**: it still takes the font of the app it sits in
  (`--pnb-font: inherit`), the owner's choice, in every theme. On the site it
  shows Museo Sans Rounded because the site does.
- **Figma stays on Mulish for now.** The Figma connection draws text with
  Figma's own fonts only, never those on the owner's computer (it sees no
  Windows font at all), so it cannot set Museo Sans Rounded. In the Figma
  desktop app, with the font installed, the owner can change the file's text
  styles, which carry most of the text.

## 2026-11-01: The configurator loses "Write and send", Board gains Lines and Filter

The owner found two steps of `customize.html` illogical. Designed in Figma
first (Page 3, "Site · Customize · Board · Lines and Filter (2026-11-01)"),
built after the owner approved it. For 0.3.0.

- **"Write and send" is gone.** Its colours were all offered in other steps
  already. What only it had is dropped from the configurator, the owner's
  choice: the send button's words (the widget's own, in every language) and
  Danger. Both can still be set in code. The screenshots setting, which was
  there too, moved to Settings rather than going with it. The old Figma frame
  is kept, dimmed and named as removed.
- **Board shows five colours up front**: Cards, Text, Background, Lines and
  Filter. Lines (`--pnb-line`) was behind "More colours", though the card
  borders are in plain sight on that screen.
- **Filter is a new token**, `--pnb-filter`, with `--pnb-on-filter` for its
  words: the chosen filter over the list, and the chosen status in an owner's
  answer sheet, which is the same kind of pill. Before, both were the text
  colour turned round; those stay the defaults, so no theme looks different.
  Only the fill is offered, the owner's choice: the configurator picks black
  or white words for it as the widget does for `accent`. A developer setting
  the token by hand sets both, since CSS cannot pick a readable colour by
  itself in every browser yet.
- The Figma step frames are behind the site (they still say eight steps and
  have Look). The proposal is a frame of its own, set in Mulish, because the
  Figma connection cannot load Museo Sans Rounded and so cannot copy or edit
  a frame that uses it.

## 2026-11-01: The round button grows into the panel, and step 1 shows each way in a phone

The owner wanted step 1 of the configurator to show what Button, Inline and
Overlay mean, and sent a video of a toolbar that grows into a menu as the
way the round button should open. Designed in Figma first (Page 3, "Site ·
Customize · Step 1 · Mode animations (2026-11-01)", as still frames with
timings), built after the owner approved it. For 0.3.0.

- **The real widget morphs**, the owner's choice over showing it on the site
  alone: a tap grows the round button into the panel (340 ms) and closing
  shrinks the panel back into it (260 ms), on a phone (the whole screen) and
  on a wide screen (the corner panel). The panel is cut to the button's disc
  and the cut opens (`clip-path`), a skin in the button's colour with its
  glyph lies over it and fades, and the tiles come in out of a slight blur
  with a small spring. With the Web Animations API, since where the button
  is relative to the panel is only known on the screen; the skin lives
  inside the panel, so a page that moves fixed positions (a transformed
  parent, as on the configurator) cannot misplace it. The button stays in
  the page, hidden, while the panel is open, to measure where to shrink to.
  Only a tap grows it: a screen the demo holds open is just there. With
  reduced motion it opens and closes without moving, as before. Overlay and
  inline are unchanged.
- **Step 1 shows a phone** in the big box instead of the widget, playing the
  chosen way over and over: the button growing into the tiles; the app's own
  menu, then its Feedback page with the board inline in it; the app's own
  "Send feedback", then the board rising from the bottom. Each loop is 4 to
  4.6 s. In a phone because Overlay only rises from the bottom on a phone,
  and these are phone apps. The widgets in it are real ones in `demo` mode,
  inline and held on a screen, in the chosen colours; the motion is CSS
  keyframes in `site.css`, resting on the open state, which is what shows
  with reduced motion. Preview still shows the real widget, morph and all.
- The morph is checked on the local site at both widths, not inside Nimiq
  Pay: that waits for Shitti to take 0.3.0.

## 2026-11-01: Every way opens on the tiles, and step 1 shows the wide screen too

The owner saw only the phone on a computer, and wanted each to show what
really happens there; and wanted Inline and Overlay to arrive on the tiles
after the tap, as the button does. Built straight away, the owner's choice,
following the frames approved above.

- **Every way opens on the tiles now**, in the real widget, for everybody,
  the owner's choice: `inline` and `overlay` used to open on the board
  (2026-10-28, "`overlay` still opens on the board"). Somebody who opens a
  feedback feature mostly came to say something, and the board is one tap
  on ("See the board"). A new attribute, `start="board"`, keeps the old way;
  a `readonly` board is always the board. The site's home page board, which
  is there to be read, and the widget's demo page (the README's screenshots)
  say `start="board"`. Shitti's users see the tiles first too once Shitti
  takes 0.3.0. Weighed: a choice in step 1, with the board as the default;
  and the tiles in the animation only, which would have shown something the
  widget does not do.
- **Step 1 shows a computer screen from 640px wide**, the width at which the
  widget itself turns into the corner panel, and the phone below that; it
  changes over when the window is resized. The computer plays the widget as
  it is there: the button growing into the corner panel while the page dims,
  the app's own menu bar opening its Feedback page with the widget in a
  column, and the app's own "Send feedback" bringing the panel up in the
  corner. Overlay does not rise from the bottom there, because on a wide
  screen the widget does not either, the owner's choice.
- **No device frames**, the owner's correction the same day: a phone and a
  browser window drawn inside the box did not match the rest of the page.
  The loops now play straight on the box's own pretend app, the one the
  preview shows, at real size: the panel 375 wide and 24px from the edges
  on a wide screen, the whole box on a narrow one, as the widget itself
  sits there. Every place is measured from the box's edges or from what is
  tapped, so a box of any size plays the same.
- **Inline on a wide screen works as on a phone, sideways**, the owner's
  next correction: a menu button at the top right opens the app's menu as
  a panel on the right, Feedback in it opens the app's Feedback page in the
  rest of the screen, against the panel, and the panel stays open beside
  it. The widget takes the width it is given there, as an inline widget
  does. Before, it was a menu bar with the widget in a 375 column.

## 2026-11-01: Inline stays where step 1 left it, and screenshots get a step of their own

Three changes to the configurator, the owner's, built straight away.

- **Inline on a wide screen mirrors the phone**: the menu button stands in
  front of "Your app" and the menu slides in from the left, the Feedback
  page opening on its right. Before, both were on the right.
- **After step 1 an inline widget stays where the animation left it**, up
  to and including Code, and in Preview: in the app's Feedback page, beside
  the app's menu (open, Feedback picked) on a wide screen, under the page's
  "‹ Your app" bar on a narrow one, filling the rest of the box. Before, it
  was a 375 column in the middle of a dark box. The owner chose the exact
  end of the animation over the same place without the menu.
- **Screenshots is its own step, after Board**, instead of a choice in
  Settings. It shows the writing screen with "Add a screenshot" outlined, so
  Everyone, Only you and Off show what they do as they are picked (the note
  under the box changes; with Off the box goes). The step is left out when
  only reviews are on the tiles, since a review takes no screenshot.

## 2026-11-01: The last step feeds a prompt to the developer's AI agent

Most developers build with an AI agent now, so the Code step leads with a
prompt for it, above the code to paste by hand, which stays. Designed in
Figma first (Page 3, "Site · Customize · Code · Feed it to your AI"), built
after the owner approved it.

- **One prompt, built from the same choices as the code**: the code (and
  the CSS when colours changed), the pinned version, how to place it with
  plain HTML or a bundler, where the element goes for the way it is shown,
  the texts line when texts changed, Nimiq Pay's bar, and how to check it.
- **The server too**, the owner's choice: the agent first asks whether there
  is one, and if not walks the developer through Railway (which they click
  themselves), the app's own Node backend, or Docker. It is told never to
  make up the wallet address, the project id or the server address.
- **A little fun, kept to the edges**: the developer picks Claude, Cursor,
  Codex or another, which only changes the button ("Feed it to Claude"),
  the greeting and the toast ("Claude says nom nom. Paste it in the
  chat."); the prompt is the same for all. Names only, no logos. The pick
  is remembered nowhere, like everything on the page. "Peek at the prompt"
  shows what is copied; where copying is blocked it opens, to select by
  hand.

## 2026-11-01: A test step with confetti, one button per step, calmer loops

The owner's round after using the page, built straight away, with a look
at every step's sense.

- **The loops rest longer**: two seconds more at the end of each, so a loop
  is 6 to 6.6 s. The motion keeps its speed; only the wait before it starts
  again grew. It felt busy.
- **A test step after "Feedback sent!"**, "Your widget is done!": the widget
  in the box is itself there, every tap its own, with a line on what to try
  for the way chosen, confetti in the site's colours once on arriving
  (forward only, never with reduced motion), and one big "Get the code".
  The Preview button on every step is gone, the owner's choice: trying it
  out has its own step now, and every step has only Back and Next.
- **No agent picker**: one button, "Feed it to your AI agent", one toast
  ("Nom nom. Now paste it into your agent's chat."), and the prompt greets
  with "Hi!". The owner found the pick unneeded, and it changed nothing in
  the prompt anyway.
- **One big button per step.** On the last step "Copy code" moved from the
  bottom, where it competed with the agent's button, to a quiet button
  beside the HTML and CSS tabs. The last step's foot has only Back.
- **The line over the box fits each step.** "Tap a part of the widget to
  change it" only where a part can be tapped; Settings says the box shows
  how it opens, Screenshots that the widget shows what changes, the test
  step that everything works, and Code to hand it to an agent or paste it.

## 2026-11-01: No test step; the last step is live and says "You're ready!"

Reverses the test step of the entry above, the same day. The owner: that
the widget works goes without saying; what a developer wants to check is
whether the colours and words they changed are right, and they can do that
where they take the code.

- **The test step is gone** (seven steps again with the round button). The
  widget in the box is itself in the last step, Code, every tap its own;
  the line over the box says to check the colours and words there, then
  take the code.
- **"You're ready!"** is Shitti's fanfare, the one it shows when you invite
  somebody, the owner's choice: the page dims, one big line lands with a
  small bounce, and paper is thrown from its middle in the site's colours.
  It clears itself after 2.6 seconds, sooner on a tap, and with reduced
  motion it is the line alone, briefly. Every time the last step is reached
  going forward, not on coming back to it.

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
   `main` alone builds nothing. `site/board.json` must name the home page's
   board by then, or the website's build stops.

The website on this machine: `npm run build`, then `npm run site:board` and
`npm run site` (http://localhost:5190). It shows this checkout's widget, not
npm's, on a local board in memory. Before
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
