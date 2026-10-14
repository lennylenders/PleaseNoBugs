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

## Two ways to use it

1. **Hosted**: create a project, paste one tag into your app, done.
2. **Self-hosted**: run the server yourself. It is the same code.

## Packages

| Package | What it is |
|---|---|
| [`@pleasenobugs/core`](packages/core) | Types, rules, the login message and the lookalike matcher. No dependencies; used by everything else. |
| [`@pleasenobugs/server`](packages/server) | The API, with pluggable storage (memory and SQLite now, Postgres next). |
| [`pleasenobugs`](packages/widget) | The `<please-no-bugs>` web component and the headless client it is built on. |

## License

MIT
