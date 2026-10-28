import type { PostKind } from '@pleasenobugs/core';
import type { Translate } from '../i18n.js';
import { KIND } from './PostCard.js';
import * as Icon from './icons.js';

/**
 * The first step of writing: what kind of thing this is, as big tiles.
 *
 * **Asked before the field appears**, because a bug, a wish and an opinion
 * want different words, and picking after typing means rewriting. Tiles
 * rather than the chips this used to be, so the choice is the whole screen
 * and nobody types a bug report under "Idea" because that chip was already
 * selected.
 *
 * With an odd number of kinds the first one spans the row, so three kinds read
 * as one big "something is broken" and two smaller ones under it.
 */
export function Choose({
  t,
  kinds,
  appName,
  reviewed,
  onPick,
  onBoard,
}: {
  t: Translate;
  kinds: PostKind[];
  appName: string;
  /** This reader has a review on the board already; a second is refused. */
  reviewed: boolean;
  onPick: (kind: PostKind) => void;
  /** Present when the tiles are the first screen: a way on to the board. */
  onBoard?: () => void;
}) {
  return (
    <div class="choose">
      <h3 class="choose__title">{t('board.chooseTitle')}</h3>
      <div class={`tiles${kinds.length % 2 ? ' tiles--odd' : ''}`}>
        {kinds.map((k) => {
          const done = k === 'review' && reviewed;
          return (
            <button key={k} type="button" class={`tile tile--${k}`} disabled={done} onClick={() => onPick(k)}>
              <span class="tile__icon">{KIND[k].icon(24)}</span>
              <span class="tile__label">{t(KIND[k].tile)}</span>
              <span class="tile__note">
                {done ? t('board.tileReviewDone', { app: appName }) : t(KIND[k].note, { app: appName })}
              </span>
            </button>
          );
        })}
      </div>
      {onBoard && (
        <div class="choose__board">
          <button type="button" class="text-btn" onClick={onBoard}>
            {t('board.seeBoard')}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * What follows a post that landed: a moment that says so, then the board,
 * with the new post on top. A toast was easy to miss on a phone held at arm's
 * length; this is the one screen nobody can miss, and it leaves by itself.
 */
export function Sent({ t, onBack }: { t: Translate; onBack: () => void }) {
  return (
    <div class="sent" role="status">
      <span class="sent__check">
        <Icon.Done size={44} />
      </span>
      <h3 class="sent__title">{t('board.sent')}</h3>
      <p class="sent__note">{t('board.sentNote')}</p>
      <button type="button" class="text-btn sent__back" onClick={onBack}>
        {t('board.sentBack')}
      </button>
    </div>
  );
}
