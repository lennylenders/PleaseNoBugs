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

- **One click on Railway** *(button coming)*: fill in your app's name, its
  domain and your wallet address; the server makes your project and prints its
  id. About $1 to $1.50 a month at the size of a mini app.
- **Anywhere else**: `npx @pleasenobugs/server`, see [packages/server](packages/server).

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
