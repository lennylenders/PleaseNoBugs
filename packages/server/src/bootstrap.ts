import { isNimiqAddress, type Project } from '@pleasenobugs/core';
import { cleanLoginMessages, cleanName, cleanOrigins, newProject } from './projects.js';
import type { Store } from './store.js';

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
 *
 * **Only on an empty server.** Once any project exists these variables are
 * ignored, so changing them later never makes a second project, and a server
 * restored from a backup is left alone.
 *
 * Answers what happened, so the caller can say it; never throws.
 */
export async function bootstrapProject(
  store: Store,
  env: Record<string, string | undefined>,
): Promise<{ created: Project } | { skipped: 'not_configured' | 'has_projects' } | { invalid: string }> {
  const { PNB_PROJECT_NAME, PNB_PROJECT_ORIGINS, PNB_PROJECT_OWNER, PNB_PROJECT_LOGIN_MESSAGE } = env;
  if (!PNB_PROJECT_NAME && !PNB_PROJECT_ORIGINS && !PNB_PROJECT_OWNER) return { skipped: 'not_configured' };
  if ((await store.projects()).length > 0) return { skipped: 'has_projects' };

  const name = cleanName(PNB_PROJECT_NAME);
  if (!name) return { invalid: 'PNB_PROJECT_NAME' };
  const origins = cleanOrigins((PNB_PROJECT_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean));
  if (!origins) return { invalid: 'PNB_PROJECT_ORIGINS' };
  if (!isNimiqAddress(PNB_PROJECT_OWNER)) return { invalid: 'PNB_PROJECT_OWNER' };
  const loginMessages = cleanLoginMessages(PNB_PROJECT_LOGIN_MESSAGE ? [PNB_PROJECT_LOGIN_MESSAGE] : []);
  if (!loginMessages) return { invalid: 'PNB_PROJECT_LOGIN_MESSAGE' };

  const created = newProject({ name, origins, owner: PNB_PROJECT_OWNER, loginMessages });
  await store.putProject(created);
  return { created };
}
