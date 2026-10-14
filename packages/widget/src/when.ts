import type { CopyKey } from './i18n.js';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** Past a week, "12d ago" is arithmetic for the reader; a date is not. */
const RELATIVE_MS = 7 * DAY;

const DATES = new Map<string, Intl.DateTimeFormat>();

/**
 * When something happened, as a card says it: how long ago while that is still
 * the useful answer, the date once it is not. Returns a key rather than a
 * sentence, because the unit differs per language.
 *
 * @example
 * whenLabel(Date.now() - 5 * 60_000, 'nl')   // → { key: 'time.min', vars: { n: '5' } }
 * whenLabel(Date.now() - 30 * 86_400_000, 'nl')  // → { date: '14 sep' }
 */
export function whenLabel(
  ts: number,
  locale: string,
  now = Date.now(),
): { key: CopyKey; vars: { n: string } } | { date: string } {
  const ago = Math.max(0, now - ts);
  if (ago >= RELATIVE_MS) {
    let format = DATES.get(locale);
    if (!format) {
      format = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
      DATES.set(locale, format);
    }
    return { date: format.format(new Date(ts)).replace('.', '') };
  }
  if (ago < MINUTE) return { key: 'time.now', vars: { n: '0' } };
  if (ago < HOUR) return { key: 'time.min', vars: { n: String(Math.floor(ago / MINUTE)) } };
  if (ago < DAY) return { key: 'time.hour', vars: { n: String(Math.floor(ago / HOUR)) } };
  return { key: 'time.day', vars: { n: String(Math.floor(ago / DAY)) } };
}
