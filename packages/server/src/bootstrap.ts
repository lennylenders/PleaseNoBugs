import { isNimiqAddress, isShotRule, type Project, type Rules } from '@pleasenobugs/core';
import { cleanLoginMessages, cleanName, cleanOrigins, newProject } from './projects.js';
import type { Store } from './store.js';

const VARS = [
  'PNB_PROJECT_NAME',
  'PNB_PROJECT_ORIGINS',
  'PNB_PROJECT_OWNER',
  'PNB_PROJECT_LOGIN_MESSAGE',
  'PNB_PROJECT_SCREENSHOTS',
  'PNB_PROJECT_APPROVE',
] as const;
type BootstrapVar = (typeof VARS)[number];

/**
 * Why no project was made, precise enough to fix from the log alone: which
 * variable, what it held (`got`, absent when it was not set), and a variable
 * whose name differs only by spaces or case (`lookalike`), which is what a
 * name typed into a deploy form with a trailing space looks like.
 */
export interface BootstrapProblem {
  invalid: BootstrapVar;
  got?: string;
  lookalike?: string;
}

/**
 * Make the first project from environment variables, on a server that has
 * none yet. This is what turns the "Deploy on Railway" button into one click:
 * the developer fills three fields in the deploy form and the server is ready,
 * with the project id in its log, no command line involved.
 *
 *   PNB_PROJECT_NAME            "My app"
 *   PNB_PROJECT_ORIGINS         "https://my.app,http://localhost:5173"
 *   PNB_PROJECT_OWNER           "NQ07 ..."
 *   PNB_PROJECT_LOGIN_MESSAGE   optional, see "App logins"
 *   PNB_PROJECT_SCREENSHOTS     optional: `board` (default), `owners` or `off`
 *   PNB_PROJECT_APPROVE         optional: `on` makes new posts wait for an owner
 *
 * **Only on an empty server.** Once any project exists these variables never
 * make a second project, and a server restored from a backup keeps its name,
 * origins and owner. The login message and the two rules are the exception:
 * on a server with one project they are also read later (`addLoginMessage`,
 * `applyRules`).
 *
 * Answers what happened, so the caller can say it (`describeBootstrapProblem`);
 * never throws.
 */
export async function bootstrapProject(
  store: Store,
  env: Record<string, string | undefined>,
): Promise<{ created: Project } | { skipped: 'not_configured' | 'has_projects' } | BootstrapProblem> {
  const {
    PNB_PROJECT_NAME,
    PNB_PROJECT_ORIGINS,
    PNB_PROJECT_OWNER,
    PNB_PROJECT_LOGIN_MESSAGE,
    PNB_PROJECT_SCREENSHOTS,
    PNB_PROJECT_APPROVE,
  } = env;
  const lookalike = (name: BootstrapVar) =>
    Object.keys(env).find((k) => k !== name && k.replace(/\s+/g, '').toUpperCase() === name && env[k]);
  // A lookalike counts as an attempt: three names with a trailing space must
  // say so, not pass for a server nobody configured.
  const tried = (['PNB_PROJECT_NAME', 'PNB_PROJECT_ORIGINS', 'PNB_PROJECT_OWNER'] as const).some(
    (v) => env[v] || lookalike(v),
  );
  if (!tried) return { skipped: 'not_configured' };
  if ((await store.projects()).length > 0) return { skipped: 'has_projects' };

  const problem = (name: BootstrapVar): BootstrapProblem => {
    const got = env[name];
    const like = got ? undefined : lookalike(name);
    return { invalid: name, ...(got !== undefined ? { got } : {}), ...(like ? { lookalike: like } : {}) };
  };
  const name = cleanName(PNB_PROJECT_NAME);
  if (!name) return problem('PNB_PROJECT_NAME');
  const origins = cleanOrigins((PNB_PROJECT_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean));
  if (!origins) return problem('PNB_PROJECT_ORIGINS');
  if (!isNimiqAddress(PNB_PROJECT_OWNER)) return problem('PNB_PROJECT_OWNER');
  const loginMessages = cleanLoginMessages(PNB_PROJECT_LOGIN_MESSAGE ? [PNB_PROJECT_LOGIN_MESSAGE] : []);
  if (!loginMessages) return problem('PNB_PROJECT_LOGIN_MESSAGE');
  const rules: Partial<Rules> = {};
  if (PNB_PROJECT_SCREENSHOTS) {
    if (!isShotRule(PNB_PROJECT_SCREENSHOTS.trim())) return problem('PNB_PROJECT_SCREENSHOTS');
    rules.screenshots = PNB_PROJECT_SCREENSHOTS.trim() as Rules['screenshots'];
  }
  if (PNB_PROJECT_APPROVE) {
    const v = PNB_PROJECT_APPROVE.trim().toLowerCase();
    if (v !== 'on' && v !== 'off') return problem('PNB_PROJECT_APPROVE');
    rules.approve = v === 'on';
  }

  const created = newProject({ name, origins, owner: PNB_PROJECT_OWNER, loginMessages, rules });
  await store.putProject(created);
  return { created };
}

/** What each variable should look like, for the line that says it does not. */
const EXPECTED: Record<BootstrapVar, string> = {
  PNB_PROJECT_NAME: "Expected your app's name.",
  PNB_PROJECT_ORIGINS: 'Expected where your app runs, like https://my.app, several separated by commas.',
  PNB_PROJECT_OWNER: 'Expected a Nimiq address, like NQ07 1234 ...',
  PNB_PROJECT_LOGIN_MESSAGE: "Expected your app's own login sentence, or nothing.",
  PNB_PROJECT_SCREENSHOTS: 'Expected board, owners or off, or nothing.',
  PNB_PROJECT_APPROVE: 'Expected on or off, or nothing.',
};

/** The log line for a project that was not made: what is wrong and what would be right. */
export function describeBootstrapProblem({ invalid, got, lookalike }: BootstrapProblem): string {
  const what =
    got !== undefined && got.trim()
      ? `${invalid} does not hold up: got ${JSON.stringify(got.length > 120 ? got.slice(0, 120) + '...' : got)}.`
      : lookalike
        ? `${invalid} is not set, but ${JSON.stringify(lookalike)} is: rename it to ${invalid}, without spaces.`
        : `${invalid} is not set.`;
  return `no project created: ${what} ${EXPECTED[invalid]}`;
}

/**
 * `PNB_PROJECT_LOGIN_MESSAGE` on a server that already has its project.
 *
 * Every other `PNB_PROJECT_*` is only read on an empty server, but an app
 * login is often added later: the board runs, then the app wires in its own
 * login so its users stop signing twice. So on a server with exactly one
 * project, a login message set here is added to that project's list on start,
 * once. Never removed from here (the dashboard does that), and never on a
 * server with several projects, where it could not say which one it meant.
 */
export async function addLoginMessage(
  store: Store,
  env: Record<string, string | undefined>,
): Promise<{ added: string; project: Project } | { skipped: 'not_set' | 'not_one_project' | 'already' | 'full' } | BootstrapProblem> {
  const message = env.PNB_PROJECT_LOGIN_MESSAGE;
  if (!message) return { skipped: 'not_set' };
  const all = await store.projects();
  if (all.length !== 1) return { skipped: 'not_one_project' };
  const [project] = all;
  const listed = project.loginMessages ?? [];
  if (listed.includes(message)) return { skipped: 'already' };
  const next = cleanLoginMessages([...listed, message]);
  if (!next) {
    // Either the message itself does not hold up, or the list is full.
    return cleanLoginMessages([message]) ? { skipped: 'full' } : { invalid: 'PNB_PROJECT_LOGIN_MESSAGE', got: message };
  }
  const updated = { ...project, loginMessages: next };
  await store.putProject(updated);
  return { added: message, project: updated };
}

/**
 * `PNB_PROJECT_SCREENSHOTS` and `PNB_PROJECT_APPROVE` on a server that already
 * has its project, read on every start like `PNB_PROJECT_LOGIN_MESSAGE`.
 *
 * A board's rules change with what it is for: one that started on a public
 * page with every post waiting may later show them at once. On a server with
 * one project the variable says so and a restart applies it; set, it wins
 * over a change made elsewhere since. Left out, the rule stays as it is.
 * Never on a server with several projects.
 */
export async function applyRules(
  store: Store,
  env: Record<string, string | undefined>,
): Promise<{ changed: Partial<Rules>; project: Project } | { skipped: 'not_set' | 'not_one_project' | 'same' } | BootstrapProblem> {
  const { PNB_PROJECT_SCREENSHOTS, PNB_PROJECT_APPROVE } = env;
  if (!PNB_PROJECT_SCREENSHOTS && !PNB_PROJECT_APPROVE) return { skipped: 'not_set' };
  const all = await store.projects();
  if (all.length !== 1) return { skipped: 'not_one_project' };
  const [project] = all;
  const changed: Partial<Rules> = {};
  if (PNB_PROJECT_SCREENSHOTS) {
    const v = PNB_PROJECT_SCREENSHOTS.trim();
    if (!isShotRule(v)) return { invalid: 'PNB_PROJECT_SCREENSHOTS', got: PNB_PROJECT_SCREENSHOTS };
    if ((project.rules.screenshots ?? 'board') !== v) changed.screenshots = v;
  }
  if (PNB_PROJECT_APPROVE) {
    const v = PNB_PROJECT_APPROVE.trim().toLowerCase();
    if (v !== 'on' && v !== 'off') return { invalid: 'PNB_PROJECT_APPROVE', got: PNB_PROJECT_APPROVE };
    if (!!project.rules.approve !== (v === 'on')) changed.approve = v === 'on';
  }
  if (!Object.keys(changed).length) return { skipped: 'same' };
  const updated = { ...project, rules: { ...project.rules, ...changed } };
  await store.putProject(updated);
  return { changed, project: updated };
}
