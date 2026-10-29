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
 * **Only on an empty server.** Once any project exists these variables are
 * ignored, so changing them later never makes a second project, and a server
 * restored from a backup is left alone.
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
