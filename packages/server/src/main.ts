#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { isNimiqAddress } from '@pleasenobugs/core';
import { createApp } from './app.js';
import { cleanName, cleanOrigins, newProject } from './projects.js';
import { SqliteStore } from './sqlite-store.js';

/**
 * `pleasenobugs-server`: run the API, or create a project, against one SQLite
 * file.
 *
 *   pleasenobugs-server
 *   pleasenobugs-server create-project --name "My app" --origin https://my.app --owner "NQ07 ..."
 *
 * Configured by environment, which is what every host (Railway, Fly, a
 * systemd unit) knows how to set:
 *
 *   PORT                    where to listen                    (8787)
 *   PNB_DB                  the SQLite file                    (./pleasenobugs.db)
 *   PNB_DASHBOARD_ORIGINS   comma-separated dashboard origins  (none: no dashboard)
 *   PNB_TRUST_PROXY         proxies in front of the server     (0)
 *
 * `create-project` exists because a self-hoster has no dashboard by default,
 * and a server you cannot create a project on is a server you cannot use.
 */

const db = process.env.PNB_DB || './pleasenobugs.db';
const command = process.argv[2];

if (command === 'create-project') {
  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      name: { type: 'string' },
      origin: { type: 'string', multiple: true },
      owner: { type: 'string' },
    },
  });
  const name = cleanName(values.name);
  const origins = cleanOrigins(values.origin ?? []);
  if (!name || !origins || !isNimiqAddress(values.owner)) {
    console.error(
      'Usage: pleasenobugs-server create-project --name "My app" --origin https://my.app [--origin ...] --owner "NQ.."',
    );
    process.exit(1);
  }
  const store = new SqliteStore(db);
  const project = newProject({ name, origins, owner: values.owner });
  await store.putProject(project);
  store.close();
  console.log(`Created "${project.name}"`);
  console.log(`Project id: ${project.id}`);
  console.log(`Origins:    ${project.origins.join(', ')}`);
  console.log(`Owner:      ${project.owners[0]}`);
} else if (command === undefined || command === 'serve') {
  const port = Number(process.env.PORT) || 8787;
  const dashboardOrigins = (process.env.PNB_DASHBOARD_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const trustProxy = Number(process.env.PNB_TRUST_PROXY) || 0;

  const app = createApp({ store: new SqliteStore(db), dashboardOrigins, trustProxy });
  app.listen(port, () => {
    console.info(`[pleasenobugs] listening on :${port}, data in ${db}`);
    if (!dashboardOrigins.length) {
      console.info('[pleasenobugs] no dashboard origins: create projects with `create-project`');
    }
  });
} else {
  console.error(`Unknown command "${command}". Try: serve, create-project`);
  process.exit(1);
}
