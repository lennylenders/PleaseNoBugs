import { useMemo, useState } from 'preact/hooks';
import { NAME_MAX, type Post, type PostKind } from '@pleasenobugs/core';
import type { CopyKey, Translate } from '../i18n.js';
import { KIND, VoteButton } from './PostCard.js';

/**
 * Writing one.
 *
 * Three of the four things on this screen exist to stop somebody regretting
 * the tap afterwards:
 *
 * - **The kind is asked first**, because a bug and a wish want different words
 *   and picking after typing means rewriting.
 * - **"Everybody can read this" sits above the field**, so it arrives before
 *   the typing rather than after.
 * - **Lookalikes appear while you type** and can be seconded from here. That is
 *   the only thing on the board that reduces its own input; the alternative is
 *   five copies of the best idea with one vote each.
 *
 * **One column that scrolls, with the button at the end of it.** Shitti pinned
 * a footer and then spent a page of notes on what a phone keyboard does to a
 * pinned footer. A widget lives in apps whose keyboards it has never met, so it
 * takes the arrangement that has nothing to get wrong.
 *
 * **Sending waits for the server**, the opposite of voting: a refused vote
 * costs nothing, a refused post costs what somebody typed. So a refusal leaves
 * this screen standing with the words in it and says why on the line under the
 * button.
 */
export function Compose({
  t,
  kinds,
  posts,
  likeThis,
  left,
  perDay,
  textMax,
  name: knownName,
  appName,
  onVote,
  onSend,
}: {
  t: Translate;
  kinds: PostKind[];
  posts: Post[];
  likeThis: (posts: Post[], text: string) => Post[];
  /** Posts left today; null before the reader has signed in. */
  left: number | null;
  perDay: number;
  textMax: number;
  /** The name the server has for this wallet, or the app's suggestion. */
  name: string;
  appName: string;
  onVote: (id: string, up: boolean) => void;
  /**
   * Resolves null once it has landed, or what to say about a refusal. A
   * refusal with no key (the user declining the signature) keeps the screen
   * and says nothing: "not now" is an answer, not an error.
   */
  onSend: (post: { kind: PostKind; text: string; anon: boolean; name: string }) => Promise<
    { key: CopyKey | null; vars?: Record<string, string | number> } | null
  >;
}) {
  const [kind, setKind] = useState<PostKind>(kinds[0]);
  const [text, setText] = useState('');
  const [showName, setShowName] = useState(false);
  const [name, setName] = useState(knownName);
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<{ key: CopyKey; vars?: Record<string, string | number> } | null>(null);
  // Per keystroke, which is affordable because it is set arithmetic over a
  // list in the tens. Not debounced: a suggestion arriving half a second after
  // the word that caused it reads as a glitch.
  const alike = useMemo(() => likeThis(posts, text), [posts, text, likeThis]);
  const said = text.trim();
  const none = left !== null && left <= 0;
  const nameMissing = showName && !name.trim();

  const go = async () => {
    setSending(true);
    setProblem(null);
    const refused = await onSend({ kind, text: said, anon: !showName, name: name.trim() });
    // Landing closes this screen; only a refusal gets here.
    if (refused) {
      setProblem(refused.key ? { key: refused.key, vars: refused.vars } : null);
      setSending(false);
    }
  };

  return (
    <div class="compose">
      {kinds.length > 1 && (
        <>
          <span class="label">{t('board.whatKind')}</span>
          <div class="kinds" role="radiogroup" aria-label={t('board.whatKind')}>
            {kinds.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                class="chip-pick"
                onClick={() => setKind(k)}
              >
                <span class={`badge__dot badge__dot--${k}`}>{KIND[k].icon()}</span>
                {t(KIND[k].label)}
              </button>
            ))}
          </div>
        </>
      )}

      <p class="public">{t('board.public', { app: appName })}</p>
      <textarea
        class="field"
        value={text}
        maxLength={textMax}
        placeholder={t('board.placeholder')}
        aria-label={t('board.placeholder')}
        onInput={(e) => {
          setText((e.target as HTMLTextAreaElement).value);
          // An edit answers the complaint.
          setProblem(null);
        }}
      />
      <span class="count">{textMax - text.length}</span>

      {alike.length > 0 && (
        <div class="alike">
          <span class="label">{t('board.likeThis')}</span>
          <p class="alike__note">{t('board.likeThisNote')}</p>
          <ul class="alike__list">
            {alike.map((post) => (
              <li key={post.id} class="alike__row">
                <span class={`badge__dot badge__dot--${post.kind}`} aria-label={t(KIND[post.kind].label)}>
                  {KIND[post.kind].icon()}
                </span>
                <span class="alike__text">{post.text}</span>
                <VoteButton votes={post.votes} voted={post.voted} onVote={(up) => onVote(post.id, up)} t={t} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div class="switch-row">
        <span class="switch-row__label" id="pnb-show-name">
          {t('board.showName')}
        </span>
        <button
          type="button"
          role="switch"
          class="switch"
          aria-checked={showName}
          aria-labelledby="pnb-show-name"
          onClick={() => setShowName(!showName)}
        />
      </div>
      {showName && (
        <input
          class="input"
          value={name}
          maxLength={NAME_MAX}
          placeholder={t('board.namePlaceholder')}
          aria-label={t('board.namePlaceholder')}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
        />
      )}
      <p class="note">{t('board.anonNote')}</p>

      <div class="send">
        <button
          type="button"
          class="btn"
          disabled={!said || none || sending || nameMissing}
          aria-busy={sending}
          onClick={() => void go()}
        >
          {sending ? <span class="spinner" /> : t('board.send')}
        </button>
        {/* One line, three things to say, always in the same place. Read out
            when it changes: a refusal arrives without anybody asking. */}
        <span class={`left${problem ? ' left--bad' : ''}`} role="status">
          {problem
            ? t(problem.key, problem.vars)
            : left === null
              ? ''
              : none
                ? t('board.noneLeft', { max: perDay })
                : t('board.left', { n: left, max: perDay })}
        </span>
      </div>
    </div>
  );
}
