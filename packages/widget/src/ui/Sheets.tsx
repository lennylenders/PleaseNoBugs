import { useEffect, useState } from 'preact/hooks';
import type { Post, PostStatus } from '@pleasenobugs/core';
import type { CopyKey, Translate } from '../i18n.js';

/**
 * A sheet over the board: a scrim that closes it, and a panel that rises from
 * the bottom. Absolute inside the widget rather than fixed to the window, so an
 * inline board keeps its sheets inside its own box instead of covering the
 * host app.
 */
function Sheet({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: preact.ComponentChildren;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div class="scrim" onClick={onClose}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function DeleteSheet({ t, onConfirm, onClose }: { t: Translate; onConfirm: () => void; onClose: () => void }) {
  return (
    <Sheet label={t('board.deleteTitle')} onClose={onClose}>
      <h2 class="sheet__title">{t('board.deleteTitle')}</h2>
      <p class="sheet__quote">{t('board.deleteNote')}</p>
      <div class="sheet__actions">
        <button type="button" class="btn btn--danger" onClick={onConfirm}>
          {t('board.delete')}
        </button>
        <button type="button" class="text-btn" onClick={onClose}>
          {t('board.cancel')}
        </button>
      </div>
    </Sheet>
  );
}

/** The four states, in the order a post travels through them. */
const STATUSES: { status: PostStatus; label: CopyKey }[] = [
  { status: 'open', label: 'board.statusOpen' },
  { status: 'planned', label: 'board.statusPlanned' },
  { status: 'done', label: 'board.statusDone' },
  { status: 'declined', label: 'board.statusDeclined' },
];

/**
 * An owner answering a post: where it stands, what to say, and whether it
 * stays on the board. **One save for all three**, because three separate
 * confirmations are three chances to leave halfway.
 *
 * On a post that carries context it also shows what the app sent along (a
 * version, the host), which nobody but owners ever sees.
 */
export function ManageSheet({
  t,
  post,
  replyMax,
  onSave,
  onClose,
}: {
  t: Translate;
  post: Post;
  replyMax: number;
  onSave: (change: { status: PostStatus; reply: string; hidden: boolean }) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<PostStatus>(post.status);
  const [reply, setReply] = useState(post.reply?.text ?? '');
  const [hidden, setHidden] = useState(!!post.hidden);
  const context = post.context ? Object.entries(post.context) : [];

  return (
    <Sheet label={t('board.manage')} onClose={onClose}>
      <h2 class="sheet__title">{t('board.manage')}</h2>
      <p class="sheet__quote">{post.text}</p>

      {context.length > 0 && (
        <dl class="context" aria-label={t('board.context')}>
          {context.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <span class="label" style={{ display: 'block', marginTop: '20px', marginBottom: '8px' }}>
        {t('board.setStatus')}
      </span>
      <div class="states" role="radiogroup" aria-label={t('board.setStatus')}>
        {STATUSES.map((s) => (
          <button
            key={s.status}
            type="button"
            role="radio"
            aria-checked={status === s.status}
            class="chip-pick"
            onClick={() => setStatus(s.status)}
          >
            {t(s.label)}
          </button>
        ))}
      </div>

      <span class="label" style={{ display: 'block', marginTop: '20px', marginBottom: '8px' }}>
        {t('board.replyLabel')}
      </span>
      <textarea
        class="field"
        style={{ minHeight: '96px' }}
        value={reply}
        maxLength={replyMax}
        placeholder={t('board.replyPlaceholder')}
        aria-label={t('board.replyLabel')}
        onInput={(e) => setReply((e.target as HTMLTextAreaElement).value)}
      />

      <button type="button" class="hide-btn" aria-pressed={hidden} onClick={() => setHidden(!hidden)}>
        {t(hidden ? 'board.unhide' : 'board.hide')}
      </button>

      <div class="sheet__actions">
        <button type="button" class="btn" onClick={() => onSave({ status, reply: reply.trim(), hidden })}>
          {t('board.save')}
        </button>
      </div>
    </Sheet>
  );
}
