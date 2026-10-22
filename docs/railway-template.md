# The Railway template

What the template behind the "Deploy on Railway" button holds, so it can be
made (or made again) by clicking through Railway's template editor. Railway
keeps templates in its dashboard, not in this repository; this page is the
source of truth for what goes in.

It can only be made once this repository is public on GitHub.

## The service

| Setting | Value |
|---|---|
| Source | This GitHub repository, branch `main`, root directory `/` |
| Build | From `railway.json`: the `Dockerfile`, health check on `/health` |
| Volume | Mounted on `/data`. The Dockerfile puts the database at `/data/pleasenobugs.db`; without the volume every deploy starts from an empty board. |
| Public networking | On, with a generated `*.up.railway.app` domain. The server listens on the `PORT` Railway gives it. |
| Service name | `pleasenobugs` |

## Variables

Asked in the deploy form, each with this description:

| Variable | Required | Description |
|---|---|---|
| `PNB_PROJECT_NAME` | yes | Your app's name, as your users know it. Answers on the board are signed with it. |
| `PNB_PROJECT_ORIGINS` | yes | Where your app runs, like `https://my.app`. Several separated by commas, e.g. add `http://localhost:5173` to try it while developing. |
| `PNB_PROJECT_OWNER` | yes | Your Nimiq wallet address (`NQ..`). Signing in with it makes you the owner of the board. |
| `PNB_PROJECT_LOGIN_MESSAGE` | no | Only if your app already asks users to sign a fixed login sentence: that sentence, so they need not sign twice. Leave empty otherwise. |

Not in the form: `PNB_DB` and `PNB_TRUST_PROXY` are set by the Dockerfile,
and telemetry is on unless somebody adds `PNB_TELEMETRY=off` afterwards (the
README says how).

## Template page

- **Name:** PleaseNoBugs
- **Short description:** A feedback board for your Nimiq mini app: bugs and
  ideas from your users, on your own server.
- **Overview:** the first paragraph of the README, then "After deploying, open
  Deploy Logs: the server prints the two lines to paste into your app."

## Then

1. Deploy the template once from a Railway account with test values, check
   that Deploy Logs shows the lines to paste and that the board opens, and
   delete that test project again.
2. Put the button in the README, in place of the line that says it arrives
   later:

   ```md
   [![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/<template-code>)
   ```
