import { DEFAULT_RULES, type BoardRead, type Post, type PostKind, type PostStatus } from '@pleasenobugs/core';
import type { Client, Result } from './client.js';

/**
 * A board that lives in this page's memory, for `<please-no-bugs demo>`.
 *
 * What a website showing off the widget needs, and a developer trying it
 * before they run a server: every screen works (voting, writing, the tiles,
 * "Feedback sent!") and **nothing leaves the browser**. Nothing is stored
 * either, not even in `localStorage`, so a reload is a fresh board.
 *
 * The visitor is signed in from the start as an ordinary user, never an
 * owner: a demo should show what an app's users see.
 *
 * Typed as a {@link Client}, so a change to the real client that this one
 * does not follow is a type error rather than a demo that quietly lies.
 */
export function createDemoClient(lang = 'en'): Client {
  const now = Date.now();
  let posts: Post[] = (SAMPLES[lang as keyof typeof SAMPLES] ?? SAMPLES.en).map((s, i) => ({
    id: `demo-${i}`,
    kind: s.kind,
    text: s.text,
    at: now - s.ago,
    status: s.status ?? 'open',
    votes: s.votes,
    voted: false,
    mine: false,
    ...(s.who ? { who: s.who } : {}),
    ...(s.rating ? { rating: s.rating } : {}),
    ...(s.reply ? { reply: { text: s.reply, at: now - s.ago / 2 } } : {}),
  }));
  let name: string | undefined;
  let left = DEFAULT_RULES.perDay;
  /** Screenshots the visitor put on the board, as data URLs: still nothing leaves the page. */
  const shots = new Map<string, string>();

  const ok = <T>(data: T): Promise<Result<T>> => later({ ok: true, data });
  const no = (status: number, error: 'not_found' | 'reviewed' | 'too_many' | 'not_owner') =>
    later<never>({ ok: false, status, error });
  const find = (id: string) => posts.find((p) => p.id === id);

  return {
    project: 'demo',
    canSign: true,
    address: () => DEMO_ADDRESS,
    signIn: () => ok(DEMO_ADDRESS),
    signOut() {},

    board: () =>
      ok<BoardRead>({
        project: { id: 'demo', name: 'Demo app', rules: { ...DEFAULT_RULES, kinds: [...DEFAULT_RULES.kinds] } },
        posts: posts.map((p) => ({ ...p })),
        me: { owner: false, left, ...(name ? { name } : {}) },
      }),
    me: () => ok({ owner: false, left, ...(name ? { name } : {}) }),
    answers: () => ok({ answers: [] }),

    post(p) {
      if (left <= 0) return no(429, 'too_many');
      if (p.kind === 'review' && posts.some((q) => q.mine && q.kind === 'review')) return no(409, 'reviewed');
      left -= 1;
      posts = [
        {
          id: p.id,
          kind: p.kind,
          text: p.text,
          at: Date.now(),
          status: 'open',
          votes: 1,
          voted: true,
          mine: true,
          ...(!p.anon && name ? { who: name } : {}),
          ...(p.kind === 'review' ? { rating: p.rating } : {}),
          ...(p.shot?.board ? { shot: true } : {}),
        },
        ...posts,
      ];
      // One kept for the owners only has nobody to show it to here.
      if (p.shot?.board) shots.set(p.id, `data:${p.shot.type};base64,${p.shot.data}`);
      return ok({ ok: true as const, left });
    },
    // The visitor's own screenshots on the board; nothing else exists here.
    shot: async (id) => {
      const url = shots.get(id);
      return url ? ok(await (await fetch(url)).blob()) : no(404, 'not_found');
    },
    shotUrl: (id) => shots.get(id) ?? '',
    vote(id, up) {
      const p = find(id);
      if (!p) return no(404, 'not_found');
      if (p.voted !== up) p.votes += up ? 1 : -1;
      p.voted = up;
      return ok({ ok: true as const, votes: p.votes, voted: p.voted });
    },
    remove(id) {
      const p = find(id);
      if (!p) return no(404, 'not_found');
      posts = posts.filter((q) => q !== p);
      shots.delete(id);
      return ok({ ok: true as const });
    },
    setName(n) {
      name = n.trim() || undefined;
      // Like the server: a name shows on the posts already written with one.
      for (const p of posts) if (p.mine && p.who !== undefined) p.who = name;
      return ok({ ok: true as const, ...(name ? { name } : {}) });
    },
    manage: () => no(403, 'not_owner'),
  };
}

/** Not a real address: nothing in a demo is anybody's. */
const DEMO_ADDRESS = 'NQ00 DEMO DEMO DEMO DEMO DEMO DEMO DEMO DEMO';

/** A short wait, so the demo has the same rhythm as a board on a server. */
function later<T>(value: Result<T>): Promise<Result<T>> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 250));
}

interface Sample {
  kind: PostKind;
  text: string;
  votes: number;
  ago: number;
  status?: PostStatus;
  who?: string;
  rating?: number;
  reply?: string;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** The same board in each language the widget speaks. */
const SAMPLES: Record<'en' | 'nl' | 'de', Sample[]> = {
  en: [
    { kind: 'idea', text: 'A dark mode that follows my phone', votes: 24, ago: 6 * DAY, status: 'planned', who: 'Mira', reply: 'On its way in the next release.' },
    { kind: 'bug', text: 'The send button does nothing after I switch accounts', votes: 17, ago: 2 * DAY, status: 'done', reply: 'Fixed in 1.4.2, thanks for the steps!' },
    { kind: 'review', text: 'Fast, simple and it never asks me twice. Love it.', votes: 9, ago: 3 * DAY, rating: 5, who: 'Joost' },
    { kind: 'idea', text: 'Let me pin my favourite contacts to the top', votes: 12, ago: 4 * HOUR },
    { kind: 'review', text: 'Does what it says. The history screen could be clearer.', votes: 4, ago: 9 * DAY, rating: 4 },
    { kind: 'bug', text: 'Amounts over 1,000 overlap the currency on small phones', votes: 6, ago: 20 * HOUR, who: 'Sam' },
    { kind: 'idea', text: 'Export my history as a CSV file', votes: 3, ago: 12 * DAY, status: 'declined', reply: 'Not for now: it would mean storing more than we want to.' },
  ],
  nl: [
    { kind: 'idea', text: 'Een donkere modus die mijn telefoon volgt', votes: 24, ago: 6 * DAY, status: 'planned', who: 'Mira', reply: 'Komt in de volgende versie.' },
    { kind: 'bug', text: 'De verstuurknop doet niets nadat ik van account wissel', votes: 17, ago: 2 * DAY, status: 'done', reply: 'Opgelost in 1.4.2, bedankt voor de stappen!' },
    { kind: 'review', text: 'Snel, simpel en hij vraagt nooit twee keer. Top.', votes: 9, ago: 3 * DAY, rating: 5, who: 'Joost' },
    { kind: 'idea', text: 'Laat me mijn favoriete contacten bovenaan zetten', votes: 12, ago: 4 * HOUR },
    { kind: 'review', text: 'Doet wat hij belooft. Het geschiedenisscherm kan duidelijker.', votes: 4, ago: 9 * DAY, rating: 4 },
    { kind: 'bug', text: 'Bedragen boven 1.000 vallen over de munt op kleine telefoons', votes: 6, ago: 20 * HOUR, who: 'Sam' },
    { kind: 'idea', text: 'Mijn geschiedenis exporteren als CSV-bestand', votes: 3, ago: 12 * DAY, status: 'declined', reply: 'Voorlopig niet: dan zouden we meer moeten bewaren dan we willen.' },
  ],
  de: [
    { kind: 'idea', text: 'Ein dunkler Modus, der meinem Handy folgt', votes: 24, ago: 6 * DAY, status: 'planned', who: 'Mira', reply: 'Kommt mit der nächsten Version.' },
    { kind: 'bug', text: 'Der Senden-Knopf tut nichts, nachdem ich das Konto wechsle', votes: 17, ago: 2 * DAY, status: 'done', reply: 'Behoben in 1.4.2, danke für die Schritte!' },
    { kind: 'review', text: 'Schnell, einfach und fragt nie zweimal. Super.', votes: 9, ago: 3 * DAY, rating: 5, who: 'Joost' },
    { kind: 'idea', text: 'Lass mich meine Lieblingskontakte oben anheften', votes: 12, ago: 4 * HOUR },
    { kind: 'review', text: 'Tut, was es verspricht. Der Verlauf könnte klarer sein.', votes: 4, ago: 9 * DAY, rating: 4 },
    { kind: 'bug', text: 'Beträge über 1.000 überlappen die Währung auf kleinen Handys', votes: 6, ago: 20 * HOUR, who: 'Sam' },
    { kind: 'idea', text: 'Meinen Verlauf als CSV-Datei exportieren', votes: 3, ago: 12 * DAY, status: 'declined', reply: 'Vorerst nicht: Dafür müssten wir mehr speichern, als wir wollen.' },
  ],
};
