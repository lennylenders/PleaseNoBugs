#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { isNimiqAddress } from '@pleasenobugs/core';
import { createApp } from './app.js';
import { importBoard, ImportError } from './importer.js';
import { cleanLoginMessages, cleanName, cleanOrigins, newProject } from './projects.js';
import { SqliteStore } from './sqlite-store.js';

/**
 * `pleasenobugs-server`: run the API, or create a project, against one SQLite
 * file.
 *
 *   pleasenobugs-server
 *   pleasenobugs-server create-project --name "My app" --origin https://my.app --owner "NQ07 ..."
 *   pleasenobugs-server import --project <id> --file board.json
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
      'login-message': { type: 'string', multiple: true },
    },
  });
  const name = cleanName(values.name);
  const origins = cleanOrigins(values.origin ?? []);
  const loginMessages = cleanLoginMessages(values['login-message'] ?? []);
  if (!name || !origins || !loginMessages || !isNimiqAddress(values.owner)) {
    console.error(
      'Usage: pleasenobugs-server create-project --name "My app" --origin https://my.app [--origin ...] --owner "NQ.." [--login-message "Sign in to My app"]',
    );
    process.exit(1);
  }
  const store = new SqliteStore(db);
  const project = newProject({ name, origins, owner: values.owner, loginMessages });
  await store.putProject(project);
  store.close();
  console.log(`Created "${project.name}"`);
  console.log(`Project id: ${project.id}`);
  console.log(`Origins:    ${project.origins.join(', ')}`);
  console.log(`Owner:      ${project.owners[0]}`);
  if (project.loginMessages) console.log(`App logins: ${project.loginMessages.map((m) => JSON.stringify(m)).join(', ')}`);
} else if (command === 'import') {
  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: { project: { type: 'string' }, file: { type: 'string' } },
  });
  if (!values.project || !values.file) {
    console.error('Usage: pleasenobugs-server import --project <id> --file board.json');
    process.exit(1);
  }
  const store = new SqliteStore(db);
  const project = await store.getProject(values.project);
  if (!project) {
    console.error(`No project "${values.project}" in ${db}.`);
    process.exit(1);
  }
  try {
    const report = await importBoard(store, project, JSON.parse(readFileSync(values.file, 'utf8')));
    console.log(
      `Imported ${report.imported} posts (${report.skipped} already there), ${report.votes} votes, ${report.names} names.`,
    );
  } catch (e) {
    console.error(e instanceof ImportError ? `Nothing imported. Problem at ${e.message}` : e);
    process.exit(1);
  } finally {
    store.close();
  }
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
