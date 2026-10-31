# The Railway template

What the template behind the "Deploy on Railway" button holds, so it can be
made (or made again) by clicking through Railway's template editor. Railway
keeps templates in its dashboard, not in this repository; this page is the
source of truth for what goes in.

The template is https://railway.com/deploy/PdvdtB, in the owner's workspace
(listed as Personal, not published to the marketplace). The README links it
with the owner's referral code, `?referralCode=xm-X6O`, on purpose.

## The template itself

Template settings (the gear in the editor's left bar):

| Setting | Value |
|---|---|
| Name | `PleaseNoBugs` |
| Icon | https://cdn.jsdelivr.net/gh/lennylenders/PleaseNoBugs@v0.2.0/site/src/assets/logo.svg (pinned to a tag, so it never changes under the template) |
| Description | `Self-hosted feedback board for Nimiq mini apps: bugs and ideas from users.` (Railway allows 75 characters.) |

Nothing on the template page or in a new project mentions Shitti: the
project gets a random name, the service is `PleaseNoBugs`, and every log line
starts with `[pleasenobugs]`.

## The service

| Setting | Value |
|---|---|
| Source | This GitHub repository, default branch (`main`). Every deploy builds what is on `main` at that moment. |
| Build | The `Dockerfile` at the root of the repository. Railway uses it by itself; nothing to set. A deployed service's Settings may still say "Railpack, Default": the build log's `load build definition from Dockerfile` is what counts. |
| Health check | Settings, Deploy, Healthcheck Path: `/health`. Railway then waits for it before the new deployment takes over. |
| Restart policy | Railway's default, On Failure with up to 10 restarts. Nothing to set. |
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
| `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` | `60` | How long Railway waits for `/health`. Its default is 300 seconds; a server that has not answered in a minute is not going to. |

Left out on purpose: `PNB_PROJECT_LOGIN_MESSAGE` (an empty one would be asked
for as well; whoever needs it adds it afterwards). `PNB_DB` and
`PNB_TRUST_PROXY` come from the Dockerfile, and telemetry is on unless somebody
adds `PNB_TELEMETRY=off` (the README says how).

## Why everything is in the template, not in the repository

The repository used to carry a `railway.json` with the builder, the health
check and the restart policy. Railway calls that Config as Code and has
deprecated it: services in new projects stopped reading it on 2026-08-28, and
every deploy from a template is a new project, so the template's installations
never saw it. Services that already used it read it until 2026-12-01, then not
at all. Its successor, Infrastructure as Code (`.railway/railway.ts`), is not
read by a deploy either: the Railway CLI or a GitHub Action applies it to a
project that already exists, so a template cannot use it. What the server
needs from Railway therefore lives in the template's settings above.

Any other Railway service that builds this repository needs the same two
things set by hand: Healthcheck Path `/health` and
`RAILWAY_HEALTHCHECK_TIMEOUT_SEC=60`. Those are `pleasenobugs` in
`shitty-tasks` and the home page's board, `pleasenobugs-site` in the project
of the same name.

## Found while testing it (2026-10-24)

- The editor prefills a new variable's value with `${{RAILWAY_PROJECT_NAME}}`
  as an example; leaving it in made every board named after Railway's random
  project name. Every asked variable must show "Empty value to be filled by
  the user".
- A name typed with a trailing space (`PNB_PROJECT_ORIGINS `) is a different
  variable to the server. The server now says so in the log.
- "3 variables to configure" on the service card counts the asked ones; it is
  the quickest check that none has a value.

## Tested again (2026-10-31)

After the health check moved into the template: a new project built from the
`Dockerfile`, the build log showed `Path: /health`, `Retry window: 1m0s` and
`[1/1] Healthcheck succeeded!`, Deploy Logs showed `created project`, and
`/health` answered `{"ok":true}`. The same day the home page's board
(`pleasenobugs-site`) got `RAILWAY_HEALTHCHECK_TIMEOUT_SEC=60`; it already had
the path.

## Test it again

After any change to the template: deploy it from the template page into a
**new project** (never the `PleaseNoBugs` project, where our own server runs) with test values (`Test board`,
`https://example.com`, `NQ07 0000 0000 0000 0000 0000 0000 0000 0000`),
check that Deploy Logs shows `created project` and the lines to paste, that
the service's Settings show Healthcheck Path `/health` and the deployment's
log shows the health check passing, that `/health` answers on the domain, and
delete the project again. Its first
telemetry report stays on the collector as one extra installation with no
posts.
