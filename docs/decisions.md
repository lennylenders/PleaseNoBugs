# Decisions

Why PleaseNoBugs is the way it is. Newest at the bottom. When a decision is
reversed, add a new entry rather than editing the old one, so the reasoning
that was tried survives.

Until 2026-11-19 the website and the widget also had a second, playful look
("Classic": dark purple, raised buttons, colouring the widget in yourself) and
spoke Dutch and German. Entries about those describe code that is no longer
on `main`; it is kept on the branch `classic` (tag `classic-2026-11-19`).
See the entry of that day.

## 2026-10-14: Where it comes from

Extracted from the feedback board in the owner's own Nimiq Pay mini app,
called "the first app" in this log, where it had been running since August
2026. The first app will consume the
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

The first app signs one fixed sentence, which is safe with one app. On a shared server
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

A post with no `anon` field is anonymous. The first app did the opposite (shown unless
`anon: true`), which was fine with one client written by the same person. With
many clients, a forgotten field should fail private.

## 2026-10-14: The widget is Preact in a shadow root

Preact because the first app's board is React and ports almost line for line, at 4 kB.
A shadow root because the widget lives in other people's apps: their CSS must
not break it and its CSS must not leak. Everything is bundled in, so a host on
React 18, Vue or Svelte never reconciles a second copy of anything. 19 kB
gzipped for the script-tag build, three languages included.

## 2026-10-14: Neutral look, light and dark, themed by custom properties

Follows the phone's light/dark setting, one `accent` attribute, and every
colour is a `--pnb-*` property that is part of the public API. The first
app's look ships as a theme of its own, named after that app. The owner wants to revisit the look; the properties
are what make that possible without touching the components.

Museo Sans Rounded is not used: it is licensed to the owner and cannot be
redistributed. The widget inherits the host app's font instead.

## 2026-10-14: Three ways to show it

`inline`, `floating` (a button in the corner, the "paste one line" route) and
`overlay` (what `open()` uses).

## 2026-10-14: Nimiq Pay built in, any other wallet through `signer`

Inside Nimiq Pay the widget signs through the injected provider by itself.
Elsewhere the app passes a signer, because it already has a wallet integration
and the Hub's popups are exactly what broke on phones in the first app. Without one the
board is read-only, and says so only when somebody tries to write.

## 2026-10-14: The composer is one scrolling column

The first app pinned a footer and then wrote a page about what phone keyboards do to
pinned footers. A widget meets keyboards it has never been tested against, so
it takes the arrangement with nothing to get wrong. Cost: the send button can
scroll out of view on a short screen.

## 2026-10-14: The bin is a button, not a swipe

The first app hid deleting behind a swipe. A widget cannot teach gestures in somebody
else's app, so it is a visible button on your own posts.

## 2026-10-14: A quiet "Sign in" at the foot of the board

Reading never asks the wallet, so an owner opening the board saw no way to
answer until their first vote. A link under the list signs in without doing
anything else: owners get their controls, everybody else sees what is left of
their day before writing. Drawn only while signed out and only where a wallet
can be asked. Chosen over leaving it to the dashboard and over an attribute
telling the widget who the owner is.

## 2026-10-14: App logins, per project, off by default

Found while moving the first app across: its browser-wallet users could not have
posted at all, since a second signature in a browser means a Hub popup and
the first app already learned those strand people on phones. A project may now list
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
small Railway bill; what it comes to depends on their host and their use.

The first app runs its own server like anybody else, and that server is also where the
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
- **Collected on the first app's server** (`PNB_COLLECT=on`) rather than a service of
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

The design's colours are a theme, `vivid`, rather than the new default: the first
app and anybody else already using the widget keep the look they chose. Two tokens
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

**Later the same week: one page, and the first app's look.** The owner found the
long landing page too much. The home page is now one screen (Figma node
48:9261): one line on what it is, one button to the configurator, and the
widget to try. The tabs lead on: How it works (the kinds of feedback and the
three modes), Customize, and GitHub. The code to paste lives only on
Customize, where developers make it. The whole site, configurator included,
is in the style of the first app, dark purple with turquoise buttons, and
the widget on it uses that app's theme. The design's font is Museo Sans Rounded,
served from the site like Mulish, not from Adobe Fonts, which would tell
Adobe of every visit. Its files are "all rights reserved", so they live in
`site/src/assets/fonts/`, which git ignores: a public repo would hand them
out to anyone. Where they are missing, as in the GitHub Pages build for now,
Mulish stands in. Putting them online needs a web licence, and a way to get
them into the build that does not go through the repo.

In the first app's theme an idea is purple and a review orange, like its star,
the owner's choice in Figma; Done is teal, Planned and Not doing a quiet grey.
One kind has one colour everywhere: the badge's dot, the tile, the icon in
the site's table, and the pill that names it.

**2026-10-29: the themes are named after what they look like.** That dark
purple is the website's own look now, so the theme named after the first app
became `pleasenobugs`, and
`vivid`, whose colours come from a Nimiq feedback design, became `nimiq`.
`vivid` was never released and is simply gone. The old name is in 0.1.0 and
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
unless there is something to say (a review already written). Its old name gets
the same.

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
the first app's board, now serves images their users chose to make public, which a
privacy statement may need to mention.

## 2026-10-29: Later, other apps' boards on the site. The frame now

The owner wants, one day, the website to show the feedback of every app that
uses PleaseNoBugs, the first app first, so people can scroll through it and see
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
(`noindex`, or not), and telling the first app's users, in that app, that
their feedback can be read on the PleaseNoBugs site too. The first app is not
on the list
until then.

## 2026-10-29: The home page's board is real

The owner wants visitors to see that the widget works, by using it: the board
on the home page is now PleaseNoBugs' own, where people say what they think
of it. The configurator stays a demo, because it needs `screen`, and trying
colours should not post anything. Reverses, for the home page only, "a board
that lives in the page" of 2026-10-28.

- **Its own server**, a Railway service in a project of its own, not
  the first app's. A public page draws spam, and that app's service is also the
  telemetry address, which nothing may put at risk. The site reads it from `site/board.json`, filled in once the server
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
  account, and its popups are what the first app learned to avoid on phones), and a
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
  Pay: that waits for the first app to take 0.3.0.

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
  say `start="board"`. The first app's users see the tiles first too once it
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
- **"You're ready!"** is the first app's fanfare, the one it shows when you invite
  somebody, the owner's choice: the page dims, one big line lands with a
  small bounce, and paper is thrown from its middle in the site's colours.
  It clears itself after 2.6 seconds, sooner on a tap, and with reduced
  motion it is the line alone, briefly. Every time the last step is reached
  going forward, not on coming back to it.

## 2026-11-01: The home page plays a tour of the widget, and the panel grows in its own colour

The owner first wanted visitors to open the widget themselves (a closed
widget, a wiggling button, "Try me"), then, the same day, a tour that plays
on its own instead, in the configurator's box.

- **The home page plays a tour** in the configurator's box (`.editor`,
  `.screen`, the same size and pretend app), beside the text as the
  configurator's steps are. The real widget in `demo` mode, sample posts in
  the page's memory, nothing sent, plays through on its own, over and over
  (`assets/tour.js`, about 30 s), as a user meets it: the button tapped,
  Report a bug on the tiles, the bug typed and sent, "Feedback sent!", and
  only then the board, everybody else's feedback and the app's answers,
  scrolled, an idea voted up, closed. Its point, the owner's: all feedback
  is open for anyone to read. A subtitle says what each step is and means
  ("Step 2 of 6", a title, a line): in the app's bottom left corner beside
  the panel from 640px (not the top left, where it would cover the pretend
  app's title), above the box on a phone. A ring shows
  each tap, as in step 1; the taps are the widget's own buttons clicked from
  the script, so it shows what the widget really does. The box is `inert`:
  a click does nothing. A fresh widget each round; it waits while off
  screen or in a hidden tab; with reduced motion the board stands open,
  still. The page's own button, which goes to the real board, stays in the
  window's corner.
- **The panel grows in its own background**, everywhere: the button's colour
  no longer lies over it while it grows (the owner found that, and the
  blurred tiles, looked like a bug). The button is gone the moment it is
  tapped; on closing it comes back, with a short fade, once the panel is a
  disc again. Opacity, scale and the cut only, so it stays smooth. Step 1 of
  the configurator plays it the same way.

## 2026-11-02: The tour has an owner's side, the subtitles are titles, and no scrollbars

- **App user or App owner**, picked under the tour's box (the configurator's
  segmented choice). The owner's side: the board, Sam's bug tapped, Done
  with "Fixed in 1.4.3" and a pull request link, an answer to Sam, saved,
  the card as everybody sees it, then an update on the Updates page. A
  pick starts the tour over at once on that side; the line under the box
  says what that side is about.
- **`demo="owner"`** in the widget, for that and for any developer who wants
  to try the owner's side with no server: the same sample board, signed in
  as its owner. Answering, a status, "Fixed in", hiding and updates work in
  the page's memory as on the server (`cleanFix`, a fix gone once a post is
  no longer done, an update closing what it names). Sam's sample bug carries
  what an app would send along (version, screen), which owners see. The
  demo's updates read at once, like its board.
- **The subtitles are one short line**, no step number, the owner's
  choice: shorter to take in while it plays. About your user on one side
  and about you on the other, and only the first step says who ("Your user
  taps the button", then "Picks what it is"; "You open your board", then
  "Pick a bug"): after that it goes without saying.
- **Slower, and quieter while the bug is typed**: every pause half again as
  long (`PACE`), typing and taps as they were, so a visitor can take each
  step in. "Said already, maybe?" is hidden in the tour only: the sample
  board has a bug like the one typed, and it made the step busy.
- **No scrollbars in the widget**, everywhere (`.scroll` and `.sheet`), the
  owner's choice: on a computer they took a strip of the panel for nothing
  a wheel or a cut-off card does not already say. Scrolling is unchanged.

## 2026-11-02: The home page's text and tour in proportion

The owner found the heading and its line out of proportion with the tour.
The heading broke over three lines in a 420px column, and the text was
centred on the box and the choice under it together, so it sat low.

- **The text is centred on the box alone**: the App user / App owner choice
  and its line are a row of their own under the box (`grid-template-areas`).
- **The heading fits two lines**: a 460px text column and the heading at
  48px at most. The tour keeps at least 620px, the room the corner panel
  and the subtitle beside it need, so it is no longer the configurator's
  exact size.
- **It fits a laptop's window**: the box is the window's height less 280px
  (480 to 640px), so the box and the choice under it show on a 1280×800
  screen without scrolling.
- **Under 1100px, one column** of at most 760px, text above the box: below
  that the two would not both fit.

## 2026-11-02: The home page is the pretend app, and the tour plays when asked

The owner found a tour that starts on its own too much on arrival, wanted
to pause it, and wanted the pretend app to be the landing page itself.
Reverses the entry above on the layout.

- **The page is the pretend app**: the configurator's box (a plain rounded
  screen, the owner's choice over a browser window) the width of the page,
  with the heading, its line and two buttons as the app's own page, and the
  widget's round button in its corner. "Make it yours" sits under the box.
  The screen is the window's height less 220px (560 to 760px).
- **Nothing plays until asked**: "Watch as app user" or "Watch as app
  owner" plays that side once, over the page, then the buttons are back.
  The widget is `inert` and `aria-hidden`; the page is `inert` while it
  plays.
- **A click pauses it, another goes on**: anywhere on the box, the subtitle
  too, which is a button and says "Click to pause". Paused, the box dims
  under a play button, "Paused · Click to continue" and "Stop the demo".
  Only a visitor's click counts (`isTrusted`): the tour's own taps on the
  widget bubble up to the box as clicks too. Time in the tour runs in short
  steps that do not count while paused or out of sight, so typing stops
  mid-word; what the widget does on its own (going back to the board after
  "Feedback sent!") does not wait.
- **The subtitle** is in the app's bottom left corner from 640px, under the
  box on a phone, and only while it plays. The App user / App owner choice
  and its line under the box are gone: the two buttons are the choice.

## 2026-11-02: One "Watch demo", and the tour plays in "Your app"

- **One button, "Watch demo"**, under the heading. It turns the page into
  the configurator's pretend app, "Your app" and its skeleton, the heading
  and its line faded out, with a card in the middle: "Watch the demo as…",
  App user or App owner, and Back (or Escape) to the heading. The owner's
  choice of where the choice goes.
- **The tour plays in "Your app"**, not over the heading; when it is over,
  or stopped, the heading and "Watch demo" are back.

## 2026-11-03: A conversation under a post, in turns

The owner's problem: a developer who needed to ask about a bug could answer
once, and its author could never say anything back. Their choices, after the
Figma design "Widget · Conversation" (Page 3) was approved:

- **The author answers only right after the app**, as often as that goes
  back and forth; the app (any owner) writes whenever it likes. Only the
  author takes part, never other users. One function in core,
  `authorMayAnswer`, says whose turn it is, for the server that enforces it
  and the widget that draws the box.
- **Reviews stay as they were**: one answer from the app, nothing back.
- **Done or Not doing closes it for the author**; back to Open or Planned
  opens it again. The app may still write.
- **Public, like the reply was.** An owner can take an author's message off
  the board and put it back; a hidden message does not count for turns.
- **Your own last message can be changed or taken back** until the other side
  answers it, on both sides.
- **Cards stay short**: no messages on the board, only a count beside the
  vote, which opens the conversation on a page of its own. The owner's
  choice, so nobody scrolls past long threads to find a bug.
- **The author hears it from a note on the board** ("Demo app answered your
  bug"), like a fix, and nothing on the card. Owners see "New answer" on a
  card, and "N answers wait for you · Show only these" on top.
- **An author's message is as long as the app's** (`rules.replyMax`).
- Stored as one JSON column on the post (SQLite schema 6), changed only if
  it is still what was read, so two answers at once never both land. An old
  reply became the app's first message; `reply` is still sent, as the app's
  latest message, for widgets from before, and `manage`'s `reply` still works.
- **Approval stays a rule a board may have**, and never applies to messages.
  The owner wants it off on the website's own board: a production change,
  not made yet.

## 2026-11-03: Search and a Filter panel instead of a row of chips

From the Figma design "Widget · Search and filter":

- **One row on top**: a search field and a Filter button with a count of what
  is on. Search looks in the post and its conversation (every word, anywhere),
  marks what it found, and quotes the message when the match is there.
- **The panel**: Kind, Status, "Only my posts", and for owners "Only for you"
  (Waiting on you, Off the board, Waiting for approval where a board approves
  first). More than one choice per group; between groups all have to match.
  Choosing a status leaves reviews out: they have none. The button says how
  many posts it will show.
- **What is on shows as chips with an x** under the search, and "Clear all";
  a search and filters that leave nothing say so with one button to clear both.
- **Top / New stays where it was**, at the bottom of the board.
- **"Already on the board?" while writing** keeps the lookalikes and gives each
  a "Me too" that votes for it and closes the form.
- Not chosen: remembering the filter between visits, counts in the panel.
- The row keeps the class `.filters`, which the website's tour finds the
  board by.

## 2026-11-07: The configurator is one screen, like the home page's demo

The Customize page no longer has steps beside a small preview: it is one
screen in the demo's style ("Your app" with its grey bars, as wide and tall as
the home page's), and everything happens in it. The demo itself is unchanged.
Built straight in the site, without Figma first.

- **Six steps, in the order a user meets the widget**, as the demo tells it:
  How it opens → Tiles → Writing → Feedback sent! → Board → You're ready!
  The round button's two colours moved into the first step (shown when
  Button is picked); its own step is gone. Writing is still skipped when only
  reviews are on.
- **The card is inside the screen.** From 980px it stands on the left, under
  "Your app", and the widget is free at its own place on the right. Inline
  moves the app, its menu and its Feedback page, to the right of the card, so
  step 1's menu film is never under it.
- **Below 980px the card is a panel along the bottom** that folds to one line
  ("Step 2 of 6 · Tiles"). The app is what is left above it, so the widget is
  always whole; folded, it has the whole screen. Tapping a part opens a folded
  panel. There the screen is as tall as the device allows, taller than the
  home page's, so the widget keeps room.
- **The last step looks like the demo's end**: "You're ready!" (with the
  confetti), "Feed it to your AI agent" and "Copy code" as two big buttons,
  "Peek at the prompt" and "See the code" folded under them.
- **Nothing above the screen**, as on the home page: the step's name on the
  card is the page's heading.
- Considered and not done: Writing and Sent as one step (two widget screens
  in one step make tapping a part unclear); screenshots in the Tiles step
  (you would no longer see the screenshot box change).

## 2026-11-07: "Feedback sent!" gets its own colours, and Customize a start card

- **The Sent screen's own colours**: `--pnb-sent-title`, `--pnb-sent-note`
  (the line and "Back to the board") and `--pnb-sent-check` (the disc behind
  the tick). They default to the text, quiet text and Done colours, so
  nothing looks different; Nimiq's painted "sent" now sets them instead of
  overriding the styles. The configurator's Sent step offers only these and
  "Behind sent": before, its Text, Quiet text and Done changed the whole
  widget without saying so. In apps they work from the next release (0.3.0);
  0.2.0 ignores them and keeps the shared colours.
- **A start card before step 1**, every visit (nothing is remembered): a
  reason, not a manual. "Make it look like yours." / "A feedback button that
  fits your app is one people actually tap." / "Make it mine", and small
  under it "Free and open source. About two minutes, then copy the code or
  hand it to your AI agent." Not just "free": the board needs a server of
  your own. The steps' count starts after it. A first version listed what
  was coming in three lines; it was too long, gave no reason, and said
  things that are not always true (six steps, a round button, "your app's
  screen").
- **Beside it a sketch, in the style of What is it?'s drawings**: abstract
  (bars for words) but in the widget's own shape and place, the tiles screen
  as it opens, 24px from the corner (the whole app on a phone). The round
  button pops up, a cursor taps it, the configurator's line and name come
  up, a row of colours opens, the cursor picks one and the button takes it;
  the button opens, and the Bug, Idea and Review tiles and the background
  are coloured the same way. Then a pause, and again. A first version played
  the real widget, a second painted a made-up shape with flying dots; both
  were replaced as not abstract enough and not the widget's shape.
- **The home page's floating glyphs are on Customize too**, lighting up
  under the cursor; the class is `page--pattern` now.

## 2026-11-08: The site says it is for everyone building on Nimiq

The site barely said who the widget is for: "Nimiq" was in the home page's
tab title and one line of What is it?. Now it says so in four places, for
everyone building on the Nimiq network, not only Nimiq Pay's mini apps (some
build web apps for the desktop browser). It names no kinds of apps.

- **The home page's line under its heading names Nimiq**: "Stop guessing
  what your users want." stays, under it now, short: "Free, open-source
  feedback for Nimiq builders. Live in minutes. And let users drive your
  roadmap." Not "one tag": it also
  takes a script line and a server. A label above the heading was tried and dropped as saying it
  twice. "Free" is in that line, not on a "Get it free" button: free alone
  would over-promise, as the board needs a server of your own.
- **No "For Nimiq developers" label** (removed 2026-11-09): it sat above
  What is it?'s heading, and earlier the home page's, and was taken out.
- **The AI prompt lets the developer pick a server, neutrally**
  (2026-11-09): without one yet, the agent shows all four ways side by side
  (Railway; the app's own Node backend; Docker on a rented server; own
  hardware), what each depends on and asks, without picking one, and only
  then walks through the chosen way. Before, Railway came first and most
  worked out, which read as the advice, and own hardware was missing.
- **No server price anywhere** (2026-11-09): "about $1 a month" is gone from
  the site, the AI prompt, the README and this log. What a server costs
  depends on where it runs and how much it is used.
- **No block under the home page's demo** (removed 2026-11-09): a "Built
  for builders on [Nimiq's wordmark]" block with three reason cards and a
  docs link was built, then taken out. The home page is the demo again,
  with Nimiq in the line under its heading and in the footer.
- **The footer is one tidy row on every page**: the hexagon, "For everyone
  building on Nimiq." and "Free and open source." on the left; "Nimiq docs ·
  Mini apps · GitHub" on the right (nimiq.dev, nimiq.dev/mini-apps, the
  repo), under it on a phone. Under a thin line one short privacy line: on
  the home page "No tracking. Posts from the round button go to our own
  server, without a name, once approved.", elsewhere "No tracking." It
  replaces three loose lines whose long privacy sentence broke "Source on
  GitHub" in two.
- **What is it?** opens with "made for everyone building on Nimiq", asks
  "Why should Nimiq developers use it?", and puts the three reasons first;
  "Your feedback, no sign-up" went into the first two.
- **The AI prompt on Customize asks where the app runs**: inside Nimiq Pay
  nothing is added; anywhere else the agent gives the element a Nimiq Hub
  signer, or reuses the app's own wallet login. The pages' own steps stay
  short.
- **Nimiq's logo**, used with the Nimiq team's permission (the owner has it):
  Nimiq's own SVGs from github.com/nimiq/developer-center, in
  `site/src/assets/nimiq/`. The wordmark in the block is inline, with a white
  word, so it reads on the dark page.
- Designed first in Figma, Page 3, "Site · Nimiq for developers
  (2026-11-08)"; a first round said "Nimiq mini apps" everywhere and was
  widened.

## 2026-11-10: A second look, Nimiq's, behind a switch; `nimiq` gets the Foundation's style

The Nimiq Foundation is refreshing its brand (Overnice, late 2026): calmer and
more informative, to set the Foundation apart from the playful wallet app.
Deep navy `#040724`, a flat gold `#FFB700` whose darker shades lean red,
Manrope for text, JetBrains Mono for labels and data, and a key visual of the
logo's hexagon in layers. The owner tried it in Figma (page "Nimiq refresh")
and wants it, without giving up PleaseNoBugs' own purple.

- **The site has two looks and a switch.** A button with words at the end of
  the header ("Nimiq style" / "Classic style", the look it switches to; on a
  phone only its half-gold hexagon) flips the whole site, like a dark/light
  switch. `assets/style.js` sets `data-style="nimiq"` on `<html>` before the
  page is drawn and keeps the choice in this browser's `localStorage`
  (`pnb-style`), nowhere else. New visitors get the purple, the owner's
  choice. `assets/nimiq.css` holds the whole second look, scoped to that
  attribute: site.css's tokens turned navy-on-white, gold hexagons for
  bullets and step numbers.
- **The key visual turns, after Sören's prototype**
  (nimiq.github.io/brand-update-exploration): ten layers of the logo's
  hexagon per group, each turning once in four minutes, plain CSS on SVGs
  that `assets/hexes.js` writes into any `[data-hexes]`. On Home the demo's
  card is navy with two groups (top left, bottom right), its words in the
  middle under a "For Nimiq builders" label with the gold hexagon, and no
  gold glow; on What is it? one light group at the top right. Customize
  stays still, to work in. Standing still for
  whoever asked for less motion. The Nimiq look gets no dark mode of its own: one switch.
- **Buttons as in the prototype too**: in the Nimiq look every button on the
  site (and the style switch) is an outline, not a fill: a 2px line in navy
  10% (`#E6E6E9`), fully round, Manrope 14px semibold, 42px high. Navy words
  on white, white on the navy card.
- **Manrope and JetBrains Mono are served from the site** (`assets/fonts/`,
  latin, variable, from Fontsource's npm packages), under the SIL Open Font
  License, its text next to them. A browser fetches them only in the Nimiq look.
- **The widgets on the site follow the look**: `pleasenobugs` in the purple,
  `nimiq` in Nimiq's. The configurator does too, and so does the code it
  hands out (`theme="nimiq"`).
- **`theme="nimiq"` now is the Foundation's look, and `nimiq-dark` is new.**
  The owner chose to replace the wallet's bright gradients rather than keep
  them beside it, knowing that apps using `theme="nimiq"` change look when
  they update. Cards work as before (a count of replies, a line only when
  fixed); corners are smaller (`--pnb-radius-pill: 8px`), tiles are tinted
  and their glyph is drawn in the words' colour, no disc, close over its
  name. New tokens made that possible without a
  literal colour below the first block: `--pnb-on-dot` and one per kind and
  status, `--pnb-tile-dot-*`, `--pnb-tile-glyph-*` and `--pnb-tile-icon`, `--pnb-order-on` /
  `--pnb-on-order`, `--pnb-on-sent-check`, `--pnb-radius-pill`. Every other
  theme looks as it did.
- **Before the site goes out with this**, the widget needs a release: the
  code the site hands out loads the npm version, and on 0.2.0 `nimiq` is
  still the gradients.

## 2026-11-10: The home demo, told quietly in the Nimiq look

The owner found the intro's drawing (cartoon heads, tilted speech bubbles,
drawn arrows, things popping up) too playful for the Nimiq look. The whole
demo gets a calmer telling there; the purple look keeps its own, unchanged.

- **Same story, same steps, same controls** (thirds, arrow keys, Esc, Skip
  intro). Only how it looks and moves changes, chosen by `data-style`
  (`calm()` in `assets/tour.js`).
- **The box stays navy with its turning hexagons all the way**; the pretend
  app is a white window inset in it (`--win`), and the widget, its panel and
  its dimming stay inside that window (put in from tour.js, as `fit` already
  sized the panel).
- **The intro is a schema.** Users are Nimiq identicons (five, composed from
  the shapes in `@nimiq/identicons`, MIT, as plain SVG files in
  `assets/nimiq/`; nothing of its code runs). Thin navy lines run from each
  up to the channel they wrote in (Reviews, Chats, DMs); most then leave, a
  dashed outline where they stood, their lines broken up. The round button
  comes in with gold rings; then gold lines run from every user to it and the
  board opens above it, a mono-labelled row for each.
- **Words fade in whole**, never typed, and the intro's lines are plainer:
  "This is your app.", "Your first users arrive.", "They give feedback
  wherever they can.", "Most of them leave without saying why.", "PleaseNoBugs
  adds one button to your app.", "All feedback in one place." Each step's
  subtitle has its number above it in mono ("02 / 05").
- **A seventh scene, in this look only: "Visible to everyone."** (2026-11-11)
  The owner wanted it said plainly that the board is public. The gold lines
  go, the board moves to the middle of the room above the words and grows
  as far as fits, a gold edge and a gold "Public" tab with an eye on it, and
  the five users gather around it, left, above and right. Scene 6's small
  line became "Every report, from every user, on one board." so the point is
  made once. The purple look keeps its six scenes; skipping counts the
  scenes of the look being shown.
- **Title cards sit on the navy and its hexagons**, the window faded out
  under them; the end is nearly navy over the board, outline buttons. Taps
  show a gold ring.

## 2026-11-12: One look for the site, and ready-made designs in Customize

- **The site's Nimiq look is parked.** The first version shows only the
  purple: the header's style switch stays hidden and an earlier Nimiq choice
  is not read (`PARKED` in `assets/style.js` brings it back). `nimiq.css`,
  the calm demo and the rest stay in the repo.
- **The Nimiq hexagon drifts with the background glyphs**, five per tile in
  `assets/pattern.svg`, as faint and as white as bug, idea and review.
- **`theme="nimiq"` is the wallet's gradients again**, as on npm 0.2.0: the
  owner wants the old Nimiq look, not the Foundation's late-2026 rebrand.
  The rebrand widget is parked in Figma only (page "Nimiq refresh"), out of
  the code; `nimiq-dark` is gone (it was never released). The newer tokens
  from that change (`--pnb-on-dot`, `--pnb-tile-icon`, `--pnb-radius-pill`,
  ...) stay: every theme still looks as before with them. With this, the
  release that the site's Nimiq look needed is no longer needed for `nimiq`.
- **Customize starts with a choice** (Figma: Page 3, "Site · Customize ·
  Ready-made designs (2026-11-12)"). The start card holds two ready-made
  designs, Nimiq and PleaseNoBugs, each showing three of its screens small
  (real widgets in `demo` mode, held still), and "Customize it myself".
  - A design card opens the design big: the real widget on the right, the
    card flips it through Button, Tiles, Writing, Sent and Board (chips, a
    tap on the widget, or the arrow keys), and "Next" goes round the two.
    "Use this design" takes it as it is (its colours and words, all three
    kinds, screenshots for everyone) straight to "You're ready!".
  - There a ready-made design gets "Shown as" (Button / Inline / Overlay,
    the same choice as step 1) and "Customize from here", which runs the
    steps starting from that design. Back goes to the design, big.
  - "Customize it myself" first asks which design to start from ("Start
    from"); the steps then work on that theme, and the code names it.
  - The intro's sketch of a widget being coloured in is gone; the cards
    took its place.

## 2026-11-13: Customize goes back to one way in, and the button gets its own step

- **The ready-made designs are gone again.** The owner would rather have
  people make the widget theirs straight away. The start card is the one from
  before 2026-11-12: "Make it look like yours.", one "Make it mine" button,
  and the sketch of a widget being coloured in, in the corner. No "Start
  from", no big view of a design, no "Shown as" or "Customize from here" in
  the last step; the steps start from the PleaseNoBugs colours. The Figma
  page of the cards stays as a record. `theme="nimiq"` stays in the widget.
- **The round button has a step of its own, "The button"**, right after "How
  it opens", and only when it is shown as a button. It offers the button's
  own colour (`--pnb-fab`, in the widget since 0.2.0) and its icon's, so
  picking it changes nothing else; Accent (send button, toggle, your vote)
  moved to Board's "More colours" only. In the PleaseNoBugs theme a picked
  button colour goes 18% darker towards the bottom, as its own raised one
  does. Shown inline or as an overlay, its colours leave the code.

## 2026-11-13: You colour the widget in yourself, part by part

- **The widget starts grey** in Customize, in the intro sketch's greys, and
  stays grey wherever nothing is picked yet: making it yours should feel like
  making something. The steps now do what the sketch shows.
- **One part at a time.** A line goes round the part with its name, and
  beside it, in the widget, a row of six colours that suit it (bright for
  tiles and buttons, dark and light for grounds and cards, white, black and
  greys for text, ...), the seventh dot any colour at all. A pick paints the
  part and the line moves on to the next grey one; tapping a coloured part,
  or its dot in the card, picks it again. The card says how far the step is.
- **Next waits** until every part of the step has a colour, so the code is
  never half grey.
- **The parts:** The button: Button, Icon. Tiles: Bug, Idea, Review (the
  kinds that are on), Background. Writing: Send button (`accent`: the send
  button, the toggle and your vote), so the round button and the buttons in
  the widget can differ; Writing is now always a step, its screenshot choice
  only with bugs or ideas. Feedback sent!: its four. Board: Cards, Text, Lines
  (the search field's border marks them). The filter only shows with the
  filters open, so it follows Text, as in the widget.
- **The small colours are worked out** from the picked ones (quiet text,
  pills, the Top / New switch, stars, the words on the tiles; the statuses
  keep the theme's own) and stay under "More colours" to set by hand.
- The intro sketch's row of colours gets the any-colour dot too.

## 2026-11-13 (later): No card in the steps; you tap what you want to change

The same day the owner took the guiding out again: the user should simply
customize the widget step by step, by tapping it.

- **No card in the steps.** The intro keeps its card (why, "Make it mine",
  the sketch) and "You're ready!" keeps its card (the code and the prompt).
  In between only a slim bar along the bottom: `← Back`, the step's name and
  number, `Next →`. No hints, no dots, no "More colours": the small colours
  are always worked out.
- **Tap a part of the widget** to change it; with a mouse a dashed line with
  its name shows what a tap would open. The tapped part gets a solid line,
  and beside it a box with what it can be: a row of colours per colour (six
  that suit it, then any colour), its words (titles, tiles, "Feedback
  sent!", "... says"), the kinds on offer (on any tile), who sees
  screenshots (on the screenshot box). On a phone the box lies along the
  bottom. **Nothing moves on by itself**: try colours, then tap the next
  part or beside the widget.
- **Text colours:** only the big texts are picked: Text (titles and what
  people wrote) and the "Feedback sent!" title. Quiet text, the small line
  on "sent", the words on tiles and buttons are worked out.
- **Next is always there; what is not coloured stays grey**, in the code too.
- **How it opens** shows the three ways side by side, each a card playing
  its phone animation, tapped to pick; on a phone one card at a time,
  swiped, with dots.
- A tap is read when the pointer comes up, because the send button is
  disabled until something is written and a disabled button gets no click.
  Writing scrolls the send button into view once; the widget scrolls again
  while being customized.
- **The board comes right after the tiles**: How it opens, The button,
  Tiles, Board, Writing, Feedback sent!, You're ready!. Most of the widget's
  colours are on the board.
- **The send button shows in full while you colour it in**, not faded as a
  disabled button is, so its colour can be judged (a style the site puts in
  the demo widget; in the last step it is the widget's own again).
- **A tile's text and icon have their own colours, per tile.** Tapping a
  tile offers three rows: Tile, Text, Icon. The widget gets
  `--pnb-tile-ink-bug` (and `-idea`, `-review`), the words on one tile,
  following `--pnb-tile-ink` unless set; `--pnb-tile-glyph-*` now follows
  its tile's words. Not picked, a tile's text is white, as on the design's
  bright tiles, and dark only on a light tile. **Not in npm 0.2.0**: the
  copied code pins 0.2.0, where all tiles share one `--pnb-tile-ink` and the
  glyph follows it, so these colours reach an app with the next release.
- **A step never changes another.** Each part has a colour of its own,
  only a family shares one (all posts on the board); the background stays
  one, as it is one panel. The widget gets parts that follow the shared
  colours unless set: `--pnb-choose-title` (the question over the tiles),
  `--pnb-title-board` and `--pnb-title-write` (the bar's title per
  screen), `--pnb-card`, `--pnb-card-text`, `--pnb-card-quiet` (the posts
  and the rating), `--pnb-field` (the field you write in) and
  `--pnb-shot-line` (round "Add screenshot"). Writing also offers the
  field, the screenshot box's line and Text (its labels: the widget's other
  words). The filters, the chosen tab and the search field go with the
  cards. Like the tile colours, these reach apps with the next release.
- **Every field you type in is one family**: the form's field and name,
  the board's search, an answer, an update. `--pnb-field` is its ground,
  and the widget adds `--pnb-field-text`, `--pnb-field-quiet` (the hint)
  and `--pnb-field-line`. Tapping any field, on Writing or the search on
  Board, offers Field, Text and Line; until its text is picked it is black
  or white, whichever reads on the field, the hint a lighter one. The
  owner's version and link fields in the "Fixed in" box are fields too now,
  where they were the background's colour.
- **The note on top of the board** ("... answered your idea") has its own
  colours, where its line and link were the send button's: `--pnb-news`,
  `--pnb-news-line`, `--pnb-news-text`, `--pnb-news-link` and
  `--pnb-news-quiet`. Tapped (its link and close too) it offers Notice,
  Text, Link and Line; its words read on the note until picked.
- **A tapped family is lined all round**: tapping a post puts a line round
  every post and the rating in view, as one colour paints them all; so too
  the bar's icons, the post texts, the fields.
- **More parts of their own** (the owner went through the list): the
  Filter button (`--pnb-filter-btn`, `-text`, `-line`); the bar's icons, one
  family on every screen (`--pnb-bar-icon`); Top / New (`--pnb-order`,
  `--pnb-order-on`, `--pnb-on-order`, `--pnb-order-text`); the vote button
  (`--pnb-vote`, `-text`, `--pnb-vote-on`, `--pnb-on-vote-on`), not the
  badges; "See the board" (`--pnb-choose-link`); the small words in a form
  (`--pnb-form-quiet`); a switch (`--pnb-switch`, `-line`, `-knob`,
  `--pnb-switch-on`, `--pnb-on-switch-on`). A card's words now carry to
  what is on it, so the badges' words follow the posts' text, and a
  read-only count their small text. "Line" moved into Cards (the line round
  the cards and the empty stars). The kind's colour stays one family: a
  tile, its badges, the stars and "REPORT A BUG".
- **An own colour by its hex.** The any-colour dot opens a field under its
  row: a swatch (the eye picker, which shows RGB in Chrome), "#" and the
  digits. Six or three digits, with or without "#", apply as typed; a wrong
  one is outlined red; leaving the field writes it out in full. An own
  colour opens with its hex in view.
- **The send button hugs the foot** of the writing screen: 16px under its
  line instead of about 48, and pushed down when the form is short.
- **What can be tapped lights up** at the start of each step: every
  tappable part glows twice and fades (the background as a dashed outline),
  gone at the first tap. Hover alone left phones without a hint.
- **"Test your widget"** with an arrow points at the widget in "You're
  ready!" (the round button, or the panel when it is inline or an overlay),
  coming in after the cheer and gone once the widget is touched.

## 2026-11-17: The Nimiq look again, made fresh from the 2026 brand

The owner got the Nimiq Foundation's updated brand files ("Brand Styleguide
[basics]", Figma file of the Foundation, copied onto our file's page "Nimiq
refresh") and asked to throw the earlier Nimiq look away and build it again
from the styleguide only, not from the old designs. Designed in Figma first
(page "PleaseNoBugs · Nimiq 2026": components, Home, Why PleaseNoBugs,
Customize, the demo's storyboard, the widget theme), approved, then built.

- **The switch is back** in the header: Classic (PleaseNoBugs' purple) stays
  the default for new visitors; the button names the look it switches to.
  `PARKED` is gone from `assets/style.js`. The tab's icon follows the look.
- **Logo in the Nimiq look:** the gold Nimiq hexagon (the master shape from
  the brand file, Brand/500 `#FFB700`, `assets/nimiq/hexagon-2026.svg`) with
  "PleaseNoBugs" in Manrope. Classic keeps its own logo.
- **Texts stay, the layout is new:** Home gets a navy hero with the brand's
  hexagon stacks and gold glow, the heading centred, and the demo on a light
  stage under it; Why PleaseNoBugs a light intro band with the fine outline
  stack, four cards with Phosphor icons, the goal on navy, three numbered
  step cards (the "why" and "add" drawings are not shown in this look);
  Customize the same screen, flat and light. Manrope and JetBrains Mono, from
  the site's own files; brackets round one label per section.
- **The stacks** (`assets/stack.js`) are the brand file's layers, read from
  Figma as one hexagon and a place per layer, drawn as SVG, and turn as the
  brand's "Motion" asks: round the stack's middle, a whole turn in 192 s,
  each layer 0.4 s behind the one in front; still with less motion. On a
  phone the hero's stack keeps to its lower right, under the words.
- **The demo, told quietly with the same words:** the six intro scenes use
  the classic lines; the line fades in at the left with "01 / 06" over it,
  the app is a white window at the right, users are plain circles with a
  mono tag for where they wrote, most of them fade, the gold round button
  gets brackets, and scene 6 opens a board with four rows and dashed lines
  from every user to it. The real widget then plays in the `nimiq` theme;
  "Build your own widget." colours copies in Nimiq-family looks only, kept
  straight; the end card is navy. The old seventh scene, identicons,
  channels and turning hexagons (`hexes.js`) are gone.
- **The widget's `nimiq` theme is replaced** by the 2026 brand: navy on
  white, a gold round button with a navy glyph, a bug's dot red, an idea's
  gold, a review's grey, Done navy, flat. New: `nimiq-dark`, the same on
  navy. Apps using `theme="nimiq"` change look with the next release (npm
  0.2.0 still has the wallet colours, and the site's copied code pins it).
- Customize's colour rows, the intro sketch and the cheer's paper use the
  brand's colours in the Nimiq look.

## 2026-11-17 (later): In the Nimiq look the feedback comes first

The owner wants the concept of the feedback feature right and working
before colouring it in. In the Nimiq look only; Classic keeps everything:

- **The demo** goes from the owner's side straight to the end card; no
  "Build your own widget." with its cursors there.
- **Customize** has three steps: **Light or dark** (two cards, each with a
  small board in its colours, the widget in the app taking the one tapped;
  a third card, greyed, "Customize your own · Coming soon", that does
  nothing), **How it opens**, and **You're ready!**. No start card, no parts
  to tap, no colours: the code names `theme="nimiq"` or `"nimiq-dark"`,
  without `accent` or CSS. Switching the header's style moves to the other
  look's first step if the one you were on is not in it.

Later the same day:

- **"Customize" is now "Make it yours"** everywhere it is named (menu, page
  title, the button on Why PleaseNoBugs), in both looks; the address stays
  `customize.html`, so links keep working. On a phone narrower than 400px
  the menu's links are a little tighter, to fit the longer name.
- In the Nimiq look the page gets **a heading** ("Make it yours" and one
  line) with a **Desktop / Phone** switch: Phone narrows the preview to a
  phone's width, the theme cards along its bottom, the three ways swiped.
- **The widget can be tried in every step** in the Nimiq look (nothing to
  colour there), not only in the last.
- **You're ready!** in the Nimiq look: 1) your server, with fields for the
  project id and address it printed (they go straight into the code and the
  prompt; kept in the page's memory only) and "No server yet? Start one on
  Railway"; 2) three ways in, each copied in one tap: paste HTML, with npm
  (install, import once, the tag), or the prompt for your AI agent; 3) a
  "Does it work?" checklist: the board loads, you can post and vote, you can
  answer as the owner. The code and the prompt stay under it to look at.

## 2026-11-18: Make it yours, step by step to a working board (Nimiq look)

"You're ready!" came right after "How it opens", while the developer still
had a server, a project id and the code to sort out. In the Nimiq look the
page now walks them through it, six steps, in the order the work comes:

1. **Light or dark**, 2. **How it opens** (as before).
3. **Your server**, wide over the stage: "I have one" (project id and
   address, which fill in the code; never saved or sent) beside "Not yet?
   Pick a way": Railway (easiest, one button), your own Node backend,
   Docker on a rented server, your own hardware, each a line and a link,
   and what every way asks: the app's name, its address, the owner's
   `NQ…` wallet. Next works without filling it in.
4. **Where does your app run?**: only in Nimiq Pay (the wallet signs, nothing
   to add) or in a browser (the Nimiq Hub signs; Nimiq Pay still signs by
   itself, as the code checks `insideNimiqPay()`). Next waits for a pick.
   A link to reusing the app's own login.
5. **Add it to your app**: the three ways side by side, each a complete
   block with its copy button: paste HTML (with a module script for the
   signer when in a browser), npm (install, import once, the tag, the
   signer), or the AI prompt, which now says where the app runs.
6. **The last step**, the widget back to try: "You're set up.", a short list
   of what was chosen (a gold tag on what is still open), and "Before you
   ship" with three checks. Ticked, the title becomes "You're live.", the
   line "Everything checks out. Ship it.", and a navy note with the gold
   hexagon says the users can speak up now. No confetti in this look;
   Classic keeps its cheer and its "You're ready!" card.

**Next waits for a choice** (same day, Nimiq look only). Nothing is picked
beforehand: Light or dark and How it opens start with no card marked (the
widget shows light, a button in the corner, until then). Next stays grey,
and the bar says why under the step's name, until: a theme is tapped; a way
is tapped; the server has a project id and an `https://` address with a
host, or "I'll set it up later" is ticked (the code then keeps
`YOUR_PROJECT_ID` and `YOUR_SERVER`); where it runs is picked; one of the
three ways in was copied. Going back keeps every choice. Classic's Next is
always there, as before.

## 2026-11-18 (later): Make it yours, less technical (Nimiq look)

The owner found the six steps too technical. The server is the hard part,
and the developer's AI agent can ask about it and set it up with them; the
prompt already holds the four ways. So in the Nimiq look there are four
steps, and the server, the code steps and the checklist above are gone:

1. **Light or dark**, 2. **How it opens**, each waiting for a pick.
3. **Where it's used**, wide over the stage, in plain words: only in Nimiq
   Pay, only in a browser, or both ("Not sure? Pick both."). A browser, or
   both, puts the Nimiq Hub signer in the code (it leaves Nimiq Pay's own
   signing alone); the prompt says which.
4. **"Your widget is ready to add."**, with the gold hexagon, the widget
   beside it to try: a big "Copy prompt for your AI agent"; what happens next
   (paste it into your agent; answer its questions, it asks which server and
   sets it up with you; try it in your app); the three choices, each with
   "Change" back to its step; "See the prompt"; and, small, "Prefer to add
   it yourself? Show the code" with the HTML and the npm steps (project id
   and server address left to fill in). No confetti.

Classic is unchanged.

**2026-11-19: the demo, clearer (Nimiq look only).**
- Before it plays the stage is a calm cover: "Demo · about a minute",
  "See how it works." and Watch demo, rather than scene 1 already standing
  there (which then seemed to start over).
- Scene 1: the "Your app" window comes up towards you once (10px, a little
  bigger, a soft shadow), holds a moment and settles back, so it is plain
  the demo is about that screen.
- While it plays the site's own round button steps aside: one gold button
  on screen, the demo's.
- The user's and the owner's side say each step big at the stage's left
  ("01 / 05" over it), as the intro does, with the app window full height
  at the right; on a phone the step on top, the app under it.
- A quarter quicker (pauses × 0.75, intro scenes × 0.8), and two lines said
  without shouting: "Your first users arrive." and "PleaseNoBugs gives it
  one place." / "An open-source feedback button in your app.".
- The back and on zones stay invisible, as they were.
- Scene 3's feedback stays the white mono tags ("REVIEW", "CHAT", "DM"; a
  navy version with sentences was tried and dropped), but each now comes
  out of its user, lifts a moment (6px, a little bigger, a soft shadow) and
  settles back, one after another, so it is plain each one says something.
  On a phone the tags show too, small, just over their users.

**2026-11-19: the right Nimiq mark.** The hexagon came from the styleguide's
title bar, a wider draft (34 × 28) than the mark in its Logo chapter. Now
it is that master mark (91 × 80, Brand/500), exported as
`assets/nimiq/hexagon-2026.svg`: in the header (27 × 24, the brand's 0.4 ×
its height to the name), the footer, the tab's icon and the last step of
Make it yours; also swapped in the Figma page's logo and footer components.

## 2026-11-19: Nimiq only, English only

For sharing with a team, the project is one thing: the Nimiq look.

- **The website** has one look, the Nimiq 2026 brand. The style switch, the
  Classic look, its colouring Customize and the "Build your own widget"
  scene are gone; site.css is the one stylesheet (it was site.css, a
  customize.css and a nimiq.css on top). Visitors see the same pages as
  before: every state was compared screenshot by screenshot.
- **The widget** has two themes, `nimiq` (now the default) and
  `nimiq-dark`. `auto`, `light`, `dark`, `pleasenobugs` and its old name, the
  `accent` attribute and `readableOn` are gone; the `--pnb-*` custom
  properties still override any colour.
- **English only.** Dutch and German left the widget. A developer puts it in
  their app's language with the `strings` property, and `lang` now only says
  which language that is, for dates. The first app becomes English when it
  updates.
- Everything as it was is parked on the branch `classic` and the tag
  `classic-2026-11-19`.
- Versions go to 0.3.0: an app on 0.2.0 keeps its look until it updates.

## 2026-11-20: The first app is stopped, our own server is back

The owner stopped the first app to work on PleaseNoBugs alone, and the
Railway project it shared with our own server is now called `PleaseNoBugs`
(only the project's name: the services and their domains stayed).

- **The first app**: its address shows one page that says it has stopped and
  points here, with a service worker that removes the app's own. Its backend
  (`shitti`) and its Nimiq node (`nimiq-node`) have no deployment, their
  volumes and variables kept, so it could come back. Its repository is
  archived.
- **Our own server** (`pleasenobugs`) had had no deployment for about a month,
  found while doing this: the telemetry address and the first app's board
  answered 404. It runs again, now from the published image
  `ghcr.io/lennylenders/pleasenobugs:0.3.0` rather than `railway up`, on the
  same volume (0.3.0 only adds columns and tables to an older file). A new
  release is a new image tag set on the service. Railway's Hobby plan takes no
  volume backups.
- The first app's board stays on it, with its posts, though nothing writes
  to it any more.

**Later the same day: deleted.** The owner took the payout wallet's recovery
words out first and opened it elsewhere, then `shitti` (with its volume and
variables), `nimiq-node` and the separate Railway project `node`, an older
Nimiq node, were deleted. The project `PleaseNoBugs` holds only our own server
and its volume now. The first app's code is still in its archived repository.

## Where it stands

The first app moved onto PleaseNoBugs on 2026-10-15 and that move is finished: its
board is project `vxgxf5j6xz` on https://pleasenobugs-production.up.railway.app
(Railway service `pleasenobugs` in the Railway project `PleaseNoBugs`, called
`shitty-tasks` until 2026-11-20, volume on `/data`),
the old posts were imported, and the app's own copy of them is gone. Its
branch `feature/pleasenobugs` was fast-forwarded into
`feature/task-input-redesign`, which is what its production runs.

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
- **The first app** takes `pleasenobugs@^0.1.1` from npm: commits `8a74708` and
  `6afaed5` on `feature/task-input-redesign`, pushed, not deployed on purpose.
  The build is byte for byte what the app already serves, so it ships with
  its next ordinary deploy.
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
- Commits here end with `Co-Authored-By: Claude Opus 5.5`; the first app's CLAUDE.md
  asks for `Claude Opus 4.8`.

## Open

- Domain (`pleasenobugs.com` / `.dev`), not yet checked.
- Ask the Nimiq team whether they want to point mini app developers at it.
