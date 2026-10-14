# PleaseNoBugs API, version 1

This is the contract between the server and everything that talks to it: the
widget, the headless client, the dashboard, and anybody writing their own. The
types named here live in [`@pleasenobugs/core`](../packages/core/src/types.ts),
which is the single source of truth; this document explains them.

## Compatibility, which is the point of the `/v1`

Everything in this file may **grow** inside v1 and nothing may **break**:

- New routes, new optional request fields and new response fields can be added
  at any time. **A client must ignore fields it does not know.**
- No field changes type or meaning, no route disappears, no error code is
  renamed. Anything that has to do one of those things is a `/v2`, and `/v1`
  keeps answering alongside it.

That is what lets the board keep improving without breaking an app somebody
shipped months ago and never touched again.

## Concepts

**Project.** One app using the board. Its `id` is public and sits in the
widget's markup. It has a name, one or more **owners** (wallet addresses), the
**origins** the widget may run on, and its **rules**.

**Post.** A `bug` or an `idea`, with a status the owners set and at most one
reply from them. One reply, never a thread: a conversation between two people
belongs in a conversation, and this is a noticeboard.

**Proof.** A Nimiq wallet signature that says who is asking. See below.

## What never leaves the server

- **The author's wallet address**, named or anonymous. A reader gets `mine:
  true` on their own posts and nothing about anybody else's.
- **Who voted.** A post carries a count and whether *you* voted, never the list.
- **The context of a post** (version, platform), except to its project's owners.

Anonymous means "not shown", never "not known": the daily limit and one vote
per wallet are both questions about who, so the address is stored.

## Authentication

Reading a board needs no proof. Writing, voting and anything an owner does
needs one, sent as a single header:

```
Authorization: Nimiq <base64url(JSON.stringify(proof))>
```

where `proof` is a `LoginProof`:

```ts
{ address: string; publicKey: string; signature: string; issued: number }
```

### The message that is signed

The wallet signs exactly the string `loginMessage()` in core produces:

```
PleaseNoBugs login
Project: <project id>
Origin: <origin the widget runs on>
Issued: <ISO 8601 timestamp>
```

The server rebuilds those bytes from the proof and the project in the URL, and
checks the signature the way the Nimiq Keyguard makes it: Ed25519 over
`SHA256("\x16Nimiq Signed Message:\n" + message.length + message)`. Both Nimiq
Pay and the Nimiq Hub sign through the Keyguard, so both produce valid proofs.

**Why the message names a project and an origin.** One server serves many
apps. If every app had its users sign the same sentence, any app could collect
those signatures and post as its users on every other app's board. Naming the
project and the origin makes a proof useless anywhere but where it was given.

### What the server checks

1. The signature is valid for the rebuilt message and `publicKey`.
2. `publicKey` derives to `address`.
3. The message's origin is one of the project's `origins`, and matches the
   request's `Origin` header when there is one.
4. `issued` is no more than 5 minutes in the future and no more than
   `LOGIN_TTL_MS` (30 days) in the past. After that the widget asks again.

Any failure answers `401 unauthorized`, without saying which check failed.

### Dashboard proofs

The dashboard manages several projects at once, so it signs with
`Project: dashboard`. Such a proof is accepted **only** on the project
management routes (marked *dashboard* below) and only from the server's own
dashboard origin. It can never post, vote or manage a post inside a widget.

## Routes

Every route is under `/v1`. Bodies are JSON. `:pid` is a project id, `:id` a
post id.

### Reading

#### `GET /v1/projects/:pid`

The project as anybody may see it: `PublicProject` (`id`, `name`, `rules`).

#### `GET /v1/projects/:pid/posts`

The whole board: a `BoardRead`.

```ts
{
  project: PublicProject;
  posts: Post[];
  me?: Me;          // present only when a valid proof was sent
}
```

- **No order is promised.** Sort on the client with `sortPosts()` from core;
  the two orders (`top`, `new`) are a view of one list, not two lists.
- Posts an owner has hidden are left out, except for owners, who get them with
  `hidden: true` so hiding can be undone.
- Without a proof every post reads `voted: false, mine: false` and `me` is
  absent.
- Paging may be added later as an optional `cursor` parameter, which is an
  addition rather than a change.

`Me` is what the reader needs before they type anything:

```ts
{ owner: boolean; name?: string; left: number }
```

`left` is how many posts remain in this wallet's rolling day. The allowance
itself is `project.rules.perDay`: **read it from here, never from a copy**, or
the client will say one number while the server refuses at another.

#### `GET /v1/projects/:pid/me` *(proof)*

The same `Me` on its own, for a widget that wants it without the board.

#### `GET /v1/projects/:pid/answers` *(proof)*

Your own posts that an owner has answered, newest first, at most 10:

```ts
{ answers: { id: string; text: string; at: number }[] }
```

`at` is when it was answered. A status change is an answer too: marking a post
Done is a reply in one word. Hiding a post is **not**, since telling somebody
their post was taken down starts an argument the board has nowhere to hold.
How long to keep showing an answer is the client's decision.

### Writing

#### `POST /v1/projects/:pid/posts` *(proof)*

```ts
{
  id: string;                         // minted by the client, at most 128 chars
  kind: 'bug' | 'idea';               // must be in project.rules.kinds
  text: string;                       // trimmed, 1..rules.textMax chars
  anon: boolean;                      // false shows the author's name, if they have one
  context?: Record<string, string>;   // at most 10 keys, values at most 100 chars
}
```

Answers `{ ok: true, left: number }`.

- The id is the client's so a post can appear on the board in the same frame as
  the tap. A second write with the same id is `409 duplicate`.
- The author's own vote is counted from the start: the number means "how many
  people want this", and the author is one of them.
- `context` is for whatever helps the owners reproduce a bug (an app version, a
  screen). The widget adds `host` (`nimiq-pay` or `browser`) by itself. It is
  shown to owners only.
- Over the daily allowance: `429 too_many`, with `perDay` in the body.

#### `POST /v1/projects/:pid/posts/:id/vote` *(proof)*

```ts
{ up: boolean }
```

Answers `{ ok: true, votes: number, voted: boolean }`. The direction is stated
rather than toggled, so a retry lands where the tap meant it to.

#### `DELETE /v1/projects/:pid/posts/:id` *(proof)*

Your own post, or any post if you own the project. `{ ok: true }`, or
`403 not_yours`.

#### `PUT /v1/projects/:pid/me` *(proof)*

```ts
{ name: string }   // trimmed, at most NAME_MAX (24) chars; empty clears it
```

Answers `{ ok: true, name?: string }`. The name is per wallet per project, and
is read when the board is read, so changing it renames your earlier posts too.
The widget may prefill it with a name the host app already knows; the user can
always change it.

### Owners

#### `POST /v1/projects/:pid/posts/:id/manage` *(proof, owner)*

```ts
{ status?: PostStatus; reply?: string; hidden?: boolean }
```

Every field is optional and only those present are written. An empty `reply`
takes the reply back. `{ ok: true }`, or `403 not_owner`.

### Projects *(dashboard)*

#### `POST /v1/projects`

```ts
{ name: string; origins: string[] }
```

Creates a project with the signing wallet as its only owner and the default
rules. Answers the full `Project`.

#### `GET /v1/projects`

Every project the signing wallet owns, each with `unseen`: how many posts
arrived since this owner last marked the project seen.

```ts
{ projects: (Project & { unseen: number })[] }
```

There are no notifications in v1. This count is how an owner finds out.

#### `PATCH /v1/projects/:pid`

```ts
{ name?: string; origins?: string[]; owners?: string[]; rules?: Partial<Rules> }
```

Owner only. `owners` may never be emptied: a project nobody owns is a project
nobody can answer.

#### `POST /v1/projects/:pid/seen`

Marks everything up to now as seen for this owner. `{ ok: true }`.

## Errors

Every error is `{ error: ErrorCode }`, sometimes with extra fields.

| Status | `error` | Meaning |
|---|---|---|
| 400 | `bad_request` | A field is missing, too long or the wrong type. |
| 401 | `unauthorized` | No proof where one is needed, or the proof failed a check. |
| 403 | `not_yours` | Deleting somebody else's post. |
| 403 | `not_owner` | An owner route, called by a non-owner. |
| 403 | `origin_not_allowed` | The request comes from an origin the project does not list. |
| 404 | `no_project` | No such project. |
| 404 | `no_post` | No such post, or one hidden from you. |
| 409 | `duplicate` | A post with this id exists. |
| 429 | `too_many` | The day's posts are used up. Carries `perDay`. |
| 429 | `rate_limited` | Too many requests. Try again later. |

## Limits

| What | Default | Where |
|---|---|---|
| Posts per wallet per rolling 24 hours | 5 | `rules.perDay` |
| Post text | 200 chars | `rules.textMax` |
| Owner reply | 300 chars | `rules.replyMax` |
| Display name | 24 chars | `NAME_MAX` |
| Context | 10 keys, 100 chars per value | `CONTEXT_MAX_KEYS`, `CONTEXT_VALUE_MAX` |
| Proof lifetime | 30 days | `LOGIN_TTL_MS` |
| Writing posts | 10 per 15 minutes per wallet | server |
