import { useState } from 'preact/hooks';
import { cleanCodeLink, codeSite, type Post, type PostKind, type PostStatus } from '@pleasenobugs/core';
import type { CopyKey, Translate } from '../i18n.js';
import { whenLabel } from '../when.js';
import * as Icon from './icons.js';

/** The glyph and the words for each kind. Exported because the compose screen
 *  and the tiles draw the same ones, and a kind that looked one way while you
 *  chose it and another once it landed would be two kinds. */
export const KIND: Record<
  PostKind,
  { icon: (size?: number) => preact.JSX.Element; label: CopyKey; plural: CopyKey; tile: CopyKey; note: CopyKey }
> = {
  bug: {
    icon: (size) => <Icon.Bug size={size} />,
    label: 'board.kindBug',
    plural: 'board.bugs',
    tile: 'board.tileBug',
    note: 'board.tileBugNote',
  },
  idea: {
    icon: (size) => <Icon.Idea size={size} />,
    label: 'board.kindIdea',
    plural: 'board.ideas',
    tile: 'board.tileIdea',
    note: 'board.tileIdeaNote',
  },
  review: {
    icon: (size) => <Icon.Review size={size} />,
    label: 'board.kindReview',
    plural: 'board.reviews',
    tile: 'board.tileReview',
    note: 'board.tileReviewNote',
  },
};

/**
 * A row of five stars, `n` of them filled, to the nearest half: an average of
 * 4.5 is four and a half stars, not five. Read out as one number.
 */
export function Stars({ n, t, size = 16 }: { n: number; t: Translate; size?: number }) {
  const halves = Math.round(n * 2) / 2;
  return (
    <span class="stars" role="img" aria-label={t('board.stars', { n: halves })}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, halves - (i - 1)));
        return (
          <span key={i} class="stars__one">
            <Icon.Star size={size} filled />
            {fill > 0 && (
              <span class="stars__fill" style={{ width: `${fill * 100}%` }}>
                <Icon.Star size={size} filled />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/**
 * The same for status, and `open` is deliberately absent: a post nobody has
 * answered wears no chip. "Open" on every card would say only that nothing has
 * happened, which is the default state of the whole board. The chip appearing
 * *is* the news.
 */
const STATUS: Partial<Record<PostStatus, { icon: () => preact.JSX.Element; label: CopyKey }>> = {
  planned: { icon: () => <Icon.Planned />, label: 'board.statusPlanned' },
  done: { icon: () => <Icon.Done />, label: 'board.statusDone' },
  declined: { icon: () => <Icon.Declined />, label: 'board.statusDeclined' },
};

export function Badge({ tone, icon, label }: { tone: string; icon: () => preact.JSX.Element; label: string }) {
  return (
    <span class="badge">
      <span class={`badge__dot badge__dot--${tone}`}>{icon()}</span>
      {label}
    </span>
  );
}

/** The mark of the site a link goes to. */
export function SiteMark({ site, size = 14 }: { site: 'GitHub' | 'GitLab'; size?: number }) {
  return site === 'GitLab' ? <Icon.GitLab size={size} /> : <Icon.GitHub size={size} />;
}

/**
 * A link to a page on GitHub or GitLab, said as one: the site's mark, the
 * words, and the arrow that says it opens elsewhere. `label` may name the
 * site (`{site}`). Only ever drawn for a link that really is on github.com
 * or gitlab.com, checked again here whatever the server sent.
 */
export function CodeLink({ href, t, label = 'fix.view' }: { href: string; t: Translate; label?: CopyKey }) {
  const safe = cleanCodeLink(href);
  const site = codeSite(href);
  if (!safe || !site) return null;
  return (
    <a
      class="code-link"
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      // Not a request to open the card, which for an owner is a button.
      onClick={(e) => e.stopPropagation()}
    >
      <SiteMark site={site} />
      <span>{t(label, { site })}</span>
      <Icon.Out size={12} />
    </a>
  );
}

/** "Fixed in 1.4.2 · View on GitHub", under a done bug or idea that says where. */
function FixLine({ post, t }: { post: Post; t: Translate }) {
  const fix = post.status === 'done' ? post.fix : undefined;
  if (!fix || (!fix.version && !fix.link)) return null;
  return (
    <div class="fix">
      {fix.version && (
        <span class="fix__version">{t(post.kind === 'idea' ? 'fix.inIdea' : 'fix.in', { version: fix.version })}</span>
      )}
      {fix.version && fix.link && <span class="fix__dot" aria-hidden="true">·</span>}
      {fix.link && <CodeLink href={fix.link} t={t} />}
    </div>
  );
}

/**
 * Seconding something, wherever it is offered: on a card, and on a lookalike
 * the compose screen turned up. One component so the two can never come to
 * look like two different actions.
 */
export function VoteButton({
  votes,
  voted,
  onVote,
  t,
  label = 'board.upvote',
}: {
  votes: number;
  voted: boolean;
  onVote: (up: boolean) => void;
  t: Translate;
  /** What seconding means here: wanting it too, or finding a review helpful. */
  label?: CopyKey;
}) {
  return (
    <button
      type="button"
      class="vote"
      aria-label={t(label)}
      aria-pressed={voted}
      onClick={(e) => {
        // Not a request to open the card, which for an owner is a button.
        e.stopPropagation();
        onVote(!voted);
      }}
    >
      <Icon.Caret />
      <span>{votes}</span>
    </button>
  );
}

/**
 * One post.
 *
 * Three things share the card and only one of them is the text: what kind of
 * thing it is, whether anything has happened to it, and how many want it. The
 * vote is the one control everybody gets.
 *
 * **Who wrote it is a label and never an address**, and an anonymous post says
 * so where the name would be, because a blank reads as a name that failed to
 * load.
 *
 * The card is a target only for an owner, whose tap opens the sheet that
 * answers it. Shitti hid the bin behind a swipe; here it is a visible button,
 * because a gesture nobody can discover is a feature nobody has, and a widget
 * in somebody else's app cannot teach its own gestures.
 *
 * **A screenshot on the board shows under the text**, small, so what the post
 * means is plain at a glance; a tap opens it whole. It loads only once the
 * card scrolls near, so a long board does not fetch every picture on it. An
 * owner sees a screenshot that is not on the board as a small mark instead,
 * and opens it from the manage sheet.
 */
export function PostCard({
  post,
  appName,
  t,
  locale,
  onVote,
  onDelete,
  onManage,
  shotUrl,
  onShot,
}: {
  post: Post;
  appName: string;
  t: Translate;
  locale: string;
  /** Absent on a read-only board: the count shows, with nothing to tap. */
  onVote?: (up: boolean) => void;
  /** Your own post, or any post for an owner. */
  onDelete?: () => void;
  /** Owners only. Absent → the card is not a target. */
  onManage?: () => void;
  /** Where its screenshot is, when that is on the board. */
  shotUrl?: string;
  /** Opens the screenshot whole. */
  onShot?: () => void;
}) {
  // A screenshot taken off between loading the board and scrolling to it.
  const [broken, setBroken] = useState(false);
  const kind = KIND[post.kind];
  const status = STATUS[post.status];
  const when = whenLabel(post.at, locale);

  return (
    <li
      class={`card${onManage ? ' card--owner' : ''}${post.hidden || post.pending ? ' card--hidden' : ''}`}
      onClick={onManage}
      role={onManage ? 'button' : undefined}
      tabIndex={onManage ? 0 : undefined}
      aria-label={onManage ? t('board.manage') : undefined}
      onKeyDown={
        onManage
          ? (e) => {
              if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onManage();
              }
            }
          : undefined
      }
    >
      <div class="card__head">
        <Badge tone={post.kind} icon={kind.icon} label={t(kind.label)} />
        {status && <Badge tone={post.status} icon={status.icon} label={t(status.label)} />}
        {post.rating !== undefined && <Stars n={post.rating} t={t} />}
        {post.shot && !shotUrl && (
          <span class="card__shot" title={t('board.shot')} aria-label={t('board.shot')}>
            <Icon.Image size={16} />
          </span>
        )}
        {post.hidden && <span class="card__off">{t('board.hidden')}</span>}
        {post.pending && <span class="card__wait">{t('board.waiting')}</span>}
        <span class="card__when">{'date' in when ? when.date : t(when.key, when.vars)}</span>
      </div>

      <p class="card__text">{post.text}</p>

      {shotUrl && !broken && (
        <button
          type="button"
          class="card__pic"
          aria-label={t('board.shotOpen')}
          onClick={(e) => {
            e.stopPropagation();
            onShot?.();
          }}
        >
          <img src={shotUrl} alt={t('board.shot')} loading="lazy" onError={() => setBroken(true)} />
        </button>
      )}

      {/* Where the fix is belongs with the answer, when there is one: it is
          what the app said back. */}
      {post.reply ? (
        <div class="card__reply">
          <span class="card__reply-who">{t('board.reply', { app: appName })}</span>
          <p class="card__reply-text">{post.reply.text}</p>
          <FixLine post={post} t={t} />
        </div>
      ) : (
        <FixLine post={post} t={t} />
      )}

      <div class="card__foot">
        <span class="card__who">{post.mine ? t('board.byYou') : (post.who ?? t('board.anon'))}</span>
        {onDelete && (
          <button
            type="button"
            class="icon-btn card__bin"
            aria-label={t('board.delete')}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Icon.Trash />
          </button>
        )}
        {onVote ? (
          <VoteButton
            votes={post.votes}
            voted={post.voted}
            onVote={onVote}
            t={t}
            label={post.kind === 'review' ? 'board.helpful' : 'board.upvote'}
          />
        ) : (
          <span class="vote vote--count" role="img" aria-label={t('board.votes', { n: post.votes })}>
            <Icon.Caret />
            <span>{post.votes}</span>
          </span>
        )}
      </div>
    </li>
  );
}
