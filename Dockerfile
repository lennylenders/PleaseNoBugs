# The PleaseNoBugs API, as deployed on Railway (or anywhere that runs a container).
#
# Builds core and the server only: the widget is published to npm and a CDN,
# never served from here. Node 24 because the SQLite store is `node:sqlite`,
# which needs 22.13 or newer.
#
# The database lives at $PNB_DB, which should be on a mounted volume, or every
# deploy starts from an empty board.

FROM node:24-slim AS build
# @nimiq/core pulls in bufferutil and utf-8-validate, which ship ready-made
# builds for x64 but not for arm64. There npm compiles them, which needs a
# compiler. Only in this stage: the result is copied, the tools are not.
ARG TARGETARCH
RUN if [ "$TARGETARCH" = "arm64" ]; then \
      apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
      && rm -rf /var/lib/apt/lists/*; \
    fi
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY packages/server/package.json packages/server/
COPY packages/widget/package.json packages/widget/
RUN npm ci --workspace @pleasenobugs/core --workspace @pleasenobugs/server --include-workspace-root --no-audit --no-fund
COPY packages/core packages/core
COPY packages/server packages/server
RUN npm run build -w @pleasenobugs/core -w @pleasenobugs/server \
 && npm prune --omit=dev --workspace @pleasenobugs/core --workspace @pleasenobugs/server --include-workspace-root

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production \
    PNB_DB=/data/pleasenobugs.db \
    PNB_TRUST_PROXY=1
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/packages/core/package.json packages/core/
COPY --from=build /app/packages/core/dist packages/core/dist
COPY --from=build /app/packages/server/package.json packages/server/
COPY --from=build /app/packages/server/dist packages/server/dist
EXPOSE 8787
CMD ["node", "packages/server/dist/main.js"]
