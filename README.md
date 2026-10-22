# PleaseNoBugs

**Bugs and ideas, straight from your users. By [Shitti](https://shitti.me).**

A feedback board you drop into your Nimiq mini app. Your users post what is
broken and what is missing, second each other's wishes, and you answer them in
one place, without asking anybody to send you an email.

> **Status: under construction.** The API contract
> ([docs/api-v1.md](docs/api-v1.md)), the server and the widget work; not yet
> published or hosted.
> This is a community tool, not an official Nimiq product.

## What it does

- **Bugs and ideas**, picked before typing, because the two want different words.
- **One vote per wallet**, so the most wanted thing rises to the top.
- **Lookalikes while typing**: posts that resemble yours appear under the field,
  so people second the existing wish instead of writing it a fifth time.
- **Your answer under every post**: Planned, Done, Declined, plus one reply.
- **Anonymous by default.** A name shows only if the author turns it on, and a
  wallet address is never shown to anyone.
- **Login is the Nimiq wallet your users already have.** No accounts, no email.

## Your server, your data

You run your own PleaseNoBugs server, so your users' feedback never leaves
infrastructure you control. Nobody else, the makers included, holds it.

Railway is the quickest start, not a requirement. The server is one container
and every post is in one file, `pleasenobugs.db`, so you can run it wherever
you like and move by copying that file.

| Where | What you depend on | Good for |
|---|---|---|
| **Railway** *(button coming)* | Railway | No command line. About $1 to $1.50 a month. |
| **A backend you already have** | Nothing new | Apps with a Node server: `npx @pleasenobugs/server`, or mount it into Express. See [packages/server](packages/server). |
| **Your own server** with Docker (a VPS, or Coolify on one) | Whoever rents you the machine, and you can switch | A few euros a month for a small VPS, with room for other things. |
| **Your own hardware** (a Raspberry Pi, a NAS) | Your internet connection and a domain name | Depending on as little as possible, if you can keep it switched on. |

### With Docker

The image is `ghcr.io/lennylenders/pleasenobugs`, for Intel/AMD and ARM.
[`docker-compose.yml`](docker-compose.yml) runs it with
[Caddy](https://caddyserver.com) in front, which gets the HTTPS certificate
by itself. You need a domain name pointing at the machine and ports 80 and 443
open.

Put the compose file in an empty folder with a `.env` file next to it:

```
PNB_DOMAIN=feedback.my.app
PNB_PROJECT_NAME=My app
PNB_PROJECT_ORIGINS=https://my.app
PNB_PROJECT_OWNER=NQ07 ...
```

The `PNB_PROJECT_*` fields are your app's name, where it runs and the wallet
you answer with. Then:

```bash
docker compose up -d
docker compose logs pleasenobugs
```

The log has the project id; the server is `https://` plus your `PNB_DOMAIN`.
Update with `docker compose pull && docker compose up -d`.

If your platform already gives you HTTPS (Coolify, a Cloudflare Tunnel to a Pi
at home), remove the `caddy` service and point the platform at `pleasenobugs`
on port 8787.

## Telemetry

Once a day your server sends us each project's **name** and **four numbers**:
how many bugs and ideas it has, and how many of each are done. That is how we
know the tool is useful. Never post text, wallet addresses, names of people or
votes. It says exactly this in its log when it starts, and
`PNB_TELEMETRY=off` switches it off.

## Packages

| Package | What it is |
|---|---|
| [`@pleasenobugs/core`](packages/core) | Types, rules, the login message and the lookalike matcher. No dependencies; used by everything else. |
| [`@pleasenobugs/server`](packages/server) | The API, with pluggable storage (memory and SQLite now, Postgres next). |
| [`pleasenobugs`](packages/widget) | The `<please-no-bugs>` web component and the headless client it is built on. |

## License

MIT
