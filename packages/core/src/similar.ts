/**
 * Words too common to say anything about what a post is about, one group per
 * language the widget speaks.
 *
 * **A new language owes this table a group.** Shitti added German without one,
 * which left "aufgabe" significant where its Dutch and English twins were not:
 * two unrelated German posts sharing it and one filler word matched, and the
 * suggestions filled with lookalikes nobody meant.
 *
 * Words that are common because of *what the app is* ("task", "nim", the app's
 * own name) are not here: those belong to a project, and are passed to
 * {@link createMatcher}.
 */
const NOISE = [
  // Dutch
  'aan', 'als', 'bij', 'dan', 'dat', 'deze', 'die', 'dit', 'een', 'heb', 'het',
  'ik', 'is', 'kan', 'kun', 'maar', 'met', 'mijn', 'niet', 'ook', 'van', 'voor',
  'wil', 'word', 'wordt', 'zijn', 'zou', 'graag', 'meer', 'moet',
  // English
  'and', 'are', 'but', 'can', 'for', 'have', 'more', 'not', 'should', 'that',
  'the', 'this', 'want', 'when', 'with', 'would', 'you', 'your',
  // German
  'aber', 'auch', 'bitte', 'dass', 'denn', 'ein', 'eine', 'einen', 'gerne',
  'ich', 'ist', 'kann', 'mehr', 'mein', 'meine', 'nicht', 'oder', 'sein',
  'sollte', 'und', 'wenn', 'werden', 'wird', 'wollen', 'möchte',
  // Every board is about an app
  'app',
];

/** What the matcher needs from a post, so it works on any list. */
export interface Matchable {
  text: string;
  votes: number;
}

/**
 * A matcher for posts that look like the one somebody is typing, so they can
 * second an existing wish instead of writing the same one again.
 *
 * Deliberately dumb: shared significant words, nothing learned and nothing
 * fetched. A board this size does not need to be right, it needs to be right
 * often enough that the obvious repeat gets caught, and being occasionally
 * unhelpful costs a glance where being slow would cost the compose screen.
 *
 * Two shared words is the bar. One catches everything (every second post says
 * "button"), and three catches almost nothing at 200 characters.
 *
 * A factory rather than a function because each matcher keeps its own cache:
 * the matcher runs on every keystroke over the whole board, a post's text
 * never changes, and the cache is only valid for one set of noise words.
 *
 * @param projectNoise  words common in *this* app, like its own name
 *
 * @example
 * const likeThis = createMatcher(['shitti', 'nim', 'taak', 'task']);
 * likeThis(posts, 'de camera opent niet bij het bewijs');
 * // → the existing "camera opent niet" post, if there is one
 */
export function createMatcher(projectNoise: Iterable<string> = []) {
  const noise = new Set([...NOISE, ...[...projectNoise].map((w) => w.toLowerCase())]);
  // Weak, so a post that falls out of the list takes its entry with it.
  const boiled = new WeakMap<object, Set<string>>();

  const meaningful = (text: string): Set<string> =>
    new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !noise.has(w)),
    );

  return function likeThis<P extends Matchable>(posts: P[], text: string, limit = 3): P[] {
    const mine = meaningful(text);
    if (mine.size < 2) return [];
    return posts
      .map((post) => {
        let theirs = boiled.get(post);
        if (!theirs) {
          theirs = meaningful(post.text);
          boiled.set(post, theirs);
        }
        let shared = 0;
        for (const word of mine) if (theirs.has(word)) shared++;
        return { post, shared };
      })
      .filter((s) => s.shared >= 2)
      .sort((a, b) => b.shared - a.shared || b.post.votes - a.post.votes)
      .slice(0, limit)
      .map((s) => s.post);
  };
}
