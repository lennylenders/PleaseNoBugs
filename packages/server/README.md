# @pleasenobugs/server

The [PleaseNoBugs](../../README.md) API. Run it on its own, or mount it into an
Express app you already have. Needs Node 22.13 or newer.

## Run it on its own

```bash
npx @pleasenobugs/server create-project --name "My app" --origin https://my.app --owner "NQ07 ..."
npx @pleasenobugs/server
```

The first command prints a project id; put that in the widget. The second
starts the API on port 8787 with its data in `./pleasenobugs.db`.

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `8787` | Where to listen. |
| `PNB_DB` | `./pleasenobugs.db` | The SQLite file. Back it up by copying it. |
| `PNB_DASHBOARD_ORIGINS` | none | Comma-separated origins allowed to run the dashboard. None means no dashboard; use `create-project`. |
| `PNB_TRUST_PROXY` | `0` | Proxies in front of the server. `1` behind Railway, Fly or a load balancer. |
| `PNB_PROJECT_NAME`, `PNB_PROJECT_ORIGINS`, `PNB_PROJECT_OWNER` | none | On an empty server, make the first project from these. Ignored once any project exists. Every start prints each project's id, and on Railway the line to paste. `PNB_PROJECT_LOGIN_MESSAGE` optionally adds an app login. |
| `PNB_TELEMETRY` | on | `off` stops the daily counts (see the main README). |
| `PNB_TELEMETRY_URL` | the PleaseNoBugs collector | Where the daily counts go. |
| `PNB_COLLECT` | off | `on` receives other servers' counts. Only the makers' server needs it. |

Node prints one `ExperimentalWarning` about SQLite at start. That is Node's
label for `node:sqlite`, which ships inside Node; nothing is wrong.

## Mount it in your own app

```ts
import express from 'express';
import { createRouter } from '@pleasenobugs/server';
import { SqliteStore } from '@pleasenobugs/server/sqlite';

const app = express();
app.use('/feedback', createRouter({ store: new SqliteStore('./feedback.db') }));
// → /feedback/v1/projects/:pid/posts, ...
```

The router brings its own CORS and JSON parsing.

## Another database

Implement the `Store` interface (`src/store.ts`) and add it to the list at the
top of `src/store.test.ts`. When that suite passes, it works.

## The API

[docs/api-v1.md](../../docs/api-v1.md).
