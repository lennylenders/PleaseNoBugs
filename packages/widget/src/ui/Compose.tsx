import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { NAME_MAX, SHOT_MAX_BYTES, takesShot, type Post, type PostKind, type ShotType } from '@pleasenobugs/core';
import type { CopyKey, Translate } from '../i18n.js';
import { KIND, VoteButton } from './PostCard.js';
import * as Icon from './icons.js';

/** A screenshot ready to send, plus a URL to show it with while you decide. */
export interface Attached {
  type: ShotType;
  /** Base64, as the API takes it. */
  data: string;
  preview: string;
  /** Whether the user ticked that everyone may see it. */
  board: boolean;
}

/**
 * Screenshots on this board: on it for everyone (with the author's yes), for
 * the owners only, or not offered at all.
 */
export type Screenshots = 'board' | 'owners' | 'off';

/** What `onSend` gets. */
export interface Draft {
  kind: PostKind;
  text: string;
  anon: boolean;
  name: string;
  rating?: number;
  shot?: Attached;
}

/**
 * Writing one, once the kind is picked (see `Choose`).
 *
 * Most of what is on this screen exists to stop somebody regretting the tap
 * afterwards:
 *
 * - **"Everybody can read this" sits above the field**, so it arrives before
 *   the typing rather than after.
 * - **Lookalikes appear while you type** and can be seconded from here. That is
 *   the only thing on the board that reduces its own input; the alternative is
 *   five copies of the best idea with one vote each. Not on a review, which is
 *   an opinion and not a request anybody else could second.
 * - **A screenshot says who sees it before it is picked**, and on a board that
 *   shows them, **goes nowhere until the user ticks that everyone may see
 *   it**. A screenshot of a wallet app is the easiest way to give away a
 *   balance, or the address that undoes posting anonymously, without
 *   noticing. Sending stays off until the box is ticked or the picture
 *   removed, so nobody posts one by tapping past the warning.
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
  kind,
  posts,
  likeThis,
  left,
  perDay,
  textMax,
  name: knownName,
  appName,
  screenshots,
  onVote,
  onSend,
}: {
  t: Translate;
  kind: PostKind;
  posts: Post[];
  likeThis: (posts: Post[], text: string) => Post[];
  /** Posts left today; null before the reader has signed in. */
  left: number | null;
  perDay: number;
  textMax: number;
  /** The name the server has for this wallet, or the app's suggestion. */
  name: string;
  appName: string;
  /** Whether a bug or an idea may carry a screenshot, and who sees it. */
  screenshots: Screenshots;
  onVote: (id: string, up: boolean) => void;
  /**
   * Resolves null once it has landed, or what to say about a refusal. A
   * refusal with no key (the user declining the signature) keeps the screen
   * and says nothing: "not now" is an answer, not an error.
   */
  onSend: (draft: Draft) => Promise<{ key: CopyKey | null; vars?: Record<string, string | number> } | null>;
}) {
  const review = kind === 'review';
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [shot, setShot] = useState<Omit<Attached, 'board'> | null>(null);
  // Asked again for every picture: a yes was about the one it was said under.
  const [agreed, setAgreed] = useState(false);
  const onBoard = screenshots === 'board';
  const [reading, setReading] = useState(false);
  const [showName, setShowName] = useState(false);
  const [name, setName] = useState(knownName);
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<{ key: CopyKey; vars?: Record<string, string | number> } | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  // Per keystroke, which is affordable because it is set arithmetic over a
  // list in the tens. Not debounced: a suggestion arriving half a second after
  // the word that caused it reads as a glitch.
  const requests = useMemo(() => posts.filter((p) => p.kind !== 'review'), [posts]);
  const alike = useMemo(() => (review ? [] : likeThis(requests, text)), [review, requests, text, likeThis]);
  const said = text.trim();
  const none = left !== null && left <= 0;
  const nameMissing = showName && !name.trim();
  const unchecked = !!shot && onBoard && !agreed;

  useEffect(() => () => void (shot && URL.revokeObjectURL(shot.preview)), [shot]);

  const attach = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    setProblem(null);
    const got = await shrink(file);
    setReading(false);
    if (got) {
      setShot(got);
      setAgreed(false);
    } else {
      setProblem({ key: 'board.shotFailed' });
    }
  };

  const go = async () => {
    setSending(true);
    setProblem(null);
    const refused = await onSend({
      kind,
      text: said,
      anon: !showName,
      name: name.trim(),
      ...(review ? { rating } : {}),
      ...(shot ? { shot: { ...shot, board: onBoard && agreed } } : {}),
    });
    // Landing closes this screen; only a refusal gets here.
    if (refused) {
      setProblem(refused.key ? { key: refused.key, vars: refused.vars } : null);
      setSending(false);
    }
  };

  return (
    <div class="compose">
      <span class={`compose__kind compose__kind--${kind}`}>
        <span class={`badge__dot badge__dot--${kind}`}>{KIND[kind].icon()}</span>
        {t(KIND[kind].tile)}
      </span>

      {review && (
        <>
          <span class="label">{t('board.yourRating')}</span>
          <div class="rate" role="radiogroup" aria-label={t('board.yourRating')}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                class={`rate__star${n <= rating ? ' rate__star--on' : ''}`}
                aria-checked={rating === n}
                aria-label={t('board.stars', { n })}
                onClick={() => setRating(n)}
              >
                <Icon.Star size={36} filled={n <= rating} />
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
        placeholder={review ? t('board.placeholderReview', { app: appName }) : t('board.placeholder')}
        aria-label={review ? t('board.placeholderReview', { app: appName }) : t('board.placeholder')}
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

      {screenshots !== 'off' && takesShot(kind) && (
        <div class="shot">
          {shot ? (
            <div class="shot__preview">
              <img src={shot.preview} alt={t('board.shot')} />
              <button
                type="button"
                class="icon-btn shot__remove"
                aria-label={t('board.shotRemove')}
                onClick={() => setShot(null)}
              >
                <Icon.Trash />
              </button>
            </div>
          ) : (
            <button
              type="button"
              class="shot__add"
              aria-busy={reading}
              disabled={reading}
              onClick={() => picker.current?.click()}
            >
              {reading ? <span class="spinner" /> : <Icon.Image />}
              {t('board.shotAdd')}
            </button>
          )}
          <p class="note">{t(onBoard ? 'board.shotNoteBoard' : 'board.shotNote', { app: appName })}</p>
          {shot && onBoard && (
            <label class="check">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed((e.target as HTMLInputElement).checked)}
              />
              <span>{t('board.shotAgree')}</span>
            </label>
          )}
          <input
            ref={picker}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const input = e.target as HTMLInputElement;
              void attach(input.files?.[0]);
              // So picking the same file again after removing it still fires.
              input.value = '';
            }}
          />
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
          disabled={!said || none || sending || reading || nameMissing || unchecked || (review && !rating)}
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

/** The longest side a screenshot is sent at: plenty to read a phone screen by. */
const SHOT_SIDE = 1600;

/**
 * A picked image, redrawn as a JPEG small enough to send, or null when the
 * browser cannot read it.
 *
 * Redrawn on a canvas rather than sent as picked, for three reasons: a phone
 * screenshot is often several megabytes; whatever format the phone used
 * (HEIC on an iPhone) becomes one the server accepts; and the redraw keeps
 * only pixels, so the location and camera details a photo carries in its
 * metadata never leave the phone.
 */
async function shrink(file: File): Promise<Omit<Attached, 'board'> | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    for (const [side, quality] of [
      [SHOT_SIDE, 0.82],
      [1200, 0.7],
      [900, 0.6],
    ] as const) {
      const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      // JPEG has no transparency; a transparent PNG would turn black.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
      if (!blob) return null;
      if (blob.size <= SHOT_MAX_BYTES) {
        return { type: 'image/jpeg', data: await base64(blob), preview: URL.createObjectURL(blob) };
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** A blob as base64, without the `data:` prefix. */
function base64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
