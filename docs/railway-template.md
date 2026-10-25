# The Railway template

What the template behind the "Deploy on Railway" button holds, so it can be
made (or made again) by clicking through Railway's template editor. Railway
keeps templates in its dashboard, not in this repository; this page is the
source of truth for what goes in.

The template is https://railway.com/deploy/PdvdtB, in the owner's workspace
(listed as Personal, not published to the marketplace). The README links it
with the owner's referral code, `?referralCode=xm-X6O`, on purpose.

## The service

| Setting | Value |
|---|---|
| Source | This GitHub repository, default branch (`main`). Every deploy builds what is on `main` at that moment. |
| Build | From `railway.json`: the `Dockerfile`, health check on `/health` |
| Volume | Mounted on `/data`. The Dockerfile puts the database at `/data/pleasenobugs.db`; without the volume every deploy starts from an empty board. |
| Public networking | HTTP, port `8787`, with a generated `*.up.railway.app` domain. |

## Variables

Asked in the deploy form: empty value, not optional, each with this
description.

| Variable | Description |
|---|---|
| `PNB_PROJECT_NAME` | Your app's name, as your users know it. Answers on the board are signed with it. |
| `PNB_PROJECT_ORIGINS` | Where your app runs, like https://my.app. Several separated by commas. |
| `PNB_PROJECT_OWNER` | Your Nimiq wallet address (NQ..). Signing in with it makes you the owner of the board. |

Set, not asked:

| Variable | Value | Why |
|---|---|---|
| `PORT` | `8787` | Railway otherwise hands the server a port of its own (8080), and the domain, pointed at 8787, answers 502. |

Left out on purpose: `PNB_PROJECT_LOGIN_MESSAGE` (an empty one would be asked
for as well; whoever needs it adds it afterwards). `PNB_DB` and
`PNB_TRUST_PROXY` come from the Dockerfile, and telemetry is on unless somebody
adds `PNB_TELEMETRY=off` (the README says how).

## Found while testing it (2026-10-24)

- The editor prefills a new variable's value with `${{RAILWAY_PROJECT_NAME}}`
  as an example; leaving it in made every board named after Railway's random
  project name. Every asked variable must show "Empty value to be filled by
  the user".
- A name typed with a trailing space (`PNB_PROJECT_ORIGINS `) is a different
  variable to the server. The server now says so in the log.
- "3 variables to configure" on the service card counts the asked ones; it is
  the quickest check that none has a value.

## Test it again

After any change to the template: deploy it from the template page into a
**new project** (never `shitty-tasks`) with test values (`Test board`,
`https://example.com`, `NQ07 0000 0000 0000 0000 0000 0000 0000 0000`),
check that Deploy Logs shows `created project` and the lines to paste, that
`/health` answers on the domain, and delete the project again. Its first
telemetry report stays on the collector as one extra installation with no
posts.
