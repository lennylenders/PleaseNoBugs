# @pleasenobugs/core

The part of [PleaseNoBugs](../../README.md) every other package shares. No
dependencies, runs in a browser and in Node 18+.

- **Types**: the v1 contract (`Post`, `Project`, `BoardRead`, `LoginProof`, ...).
  See [docs/api-v1.md](../../docs/api-v1.md).
- **Rules**: `DEFAULT_RULES`, the limits, and body validators.
- **Login**: `loginMessage()`, the exact text a wallet signs, plus encoding the
  proof into an `Authorization` header.
- **Lookalikes**: `createMatcher()`, which finds existing posts resembling the
  one being typed.
- **Sorting**: `sortPosts()` for the Top and New tabs.

```ts
import { createMatcher, sortPosts } from '@pleasenobugs/core';

const likeThis = createMatcher(['myapp']);   // words common in your app
likeThis(board.posts, draft);                 // → up to 3 lookalikes
sortPosts(board.posts, 'top');
```
