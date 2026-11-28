import { useState } from 'preact/hooks';
import { authorMayAnswer, isClosed, lastWord, type Message, type Post } from '@pleasenobugs/core';
import type { Translate } from '../i18n.js';
import { PostCard } from './PostCard.js';
import * as Icon from './icons.js';

/** Who said it, as the conversation names them: the app, you, a name, or nobody in particular. */
export function speaker(m: Message, post: Post, appName: string, t: Translate): string {
  if (m.from === 'app') return t('board.reply', { app: appName });
  if (post.mine) return t('talk.you');
  return t('talk.who', { who: post.who ?? post.short ?? t('board.anon') });
}

/**
 * The messages under a post, oldest first. The app's carry the accent line
 * that its answer always had on a card; an author's sit on the surface
 * colour, so who said what reads at a glance without reading the names.
 *
 * `actions` puts buttons under a message: changing your own last one, or an
 * owner hiding an author's.
 */
export function Thread({
  post,
  thread,
  appName,
  t,
  actions,
}: {
  post: Post;
  thread: Message[];
  appName: string;
  t: Translate;
  actions?: (m: Message) => preact.ComponentChildren;
}) {
  return (
    <ol class="thread" aria-label={t('talk.label')}>
      {thread.map((m) => {
        const extra = actions?.(m);
        return (
          <li key={m.id} class={`msg msg--${m.from}${m.hidden ? ' msg--hidden' : ''}`}>
            <span class="msg__who">
              {speaker(m, post, appName, t)}
              {m.edited ? ` · ${t('talk.edited')}` : ''}
              {m.hidden ? <span class="card__off"> · {t('board.hidden')}</span> : null}
            </span>
            <p class="msg__text">{m.text}</p>
            {extra && <div class="msg__actions">{extra}</div>}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * A text box with a count and one button, for saying something under a post:
 * the author's answer on the conversation page, or changing it.
 */
export function Answer({
  t,
  label,
  placeholder,
  max,
  initial = '',
  action,
  onSend,
  onCancel,
}: {
  t: Translate;
  label: string;
  placeholder: string;
  max: number;
  initial?: string;
  /** The button's words. */
  action: string;
  /** Resolves true once it landed, which empties the box. */
  onSend: (text: string) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const [text, setText] = useState(initial);
  const [sending, setSending] = useState(false);
  const said = text.trim();
  return (
    <div class="answer">
      <span class="label">{label}</span>
      <textarea
        class="field answer__field"
        value={text}
        maxLength={max}
        placeholder={placeholder}
        aria-label={label}
        onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
      />
      <div class="answer__row">
        <span class="count">
          {text.length} / {max}
        </span>
        {onCancel && (
          <button type="button" class="text-btn answer__cancel" onClick={onCancel}>
            {t('board.cancel')}
          </button>
        )}
        <button
          type="button"
          class="btn answer__send"
          disabled={!said || sending || said === initial.trim()}
          aria-busy={sending}
          onClick={async () => {
            setSending(true);
            const landed = await onSend(said);
            setSending(false);
            if (landed) setText('');
          }}
        >
          {sending ? <span class="spinner" /> : action}
        </button>
      </div>
    </div>
  );
}

/**
 * The conversation under one post, on a page of its own so the board's cards
 * stay short however long it gets.
 *
 * Anybody may read it. Its author gets a box to answer in, and only right
 * after the app said something: the same rule the server keeps, read from
 * the same function (`authorMayAnswer`). Until the app answers, the author
 * may change or take back what they said.
 */
export function Talk({
  post,
  appName,
  t,
  locale,
  replyMax,
  onBack,
  onSay,
  onEdit,
  onUnsay,
}: {
  post: Post;
  appName: string;
  t: Translate;
  locale: string;
  replyMax: number;
  onBack: () => void;
  /** Each resolves whether it landed. */
  onSay: (text: string) => Promise<boolean>;
  onEdit: (m: Message, text: string) => Promise<boolean>;
  onUnsay: (m: Message) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState<Message | null>(null);
  const thread = post.thread ?? [];
  const last = lastWord(thread);
  // Your own last word, before the app answered it, on a post still open.
  const yours = post.mine && last?.from === 'author' && !isClosed(post.status) ? last : undefined;
  const closed = isClosed(post.status) && post.kind !== 'review';

  return (
    <>
      <header class="bar">
        <button type="button" class="icon-btn" aria-label={t('board.back')} onClick={onBack}>
          <Icon.Back />
        </button>
        <h2 class="bar__title">{t('talk.title')}</h2>
        <span />
      </header>
      <div class="scroll talk" style={{ paddingBottom: '24px' }}>
        <ul class="list">
          <PostCard post={post} appName={appName} t={t} locale={locale} bare />
        </ul>

        {thread.length > 0 && (
          <Thread
            post={post}
            thread={thread}
            appName={appName}
            t={t}
            actions={(m) =>
              m === yours && !editing ? (
                <>
                  <button type="button" class="link-btn" onClick={() => setEditing(m)}>
                    {t('talk.edit')}
                  </button>
                  <span aria-hidden="true">·</span>
                  <button type="button" class="link-btn" onClick={() => void onUnsay(m)}>
                    {t('talk.remove')}
                  </button>
                </>
              ) : null
            }
          />
        )}

        {editing ? (
          <Answer
            key={editing.id}
            t={t}
            label={t('talk.changeLast')}
            placeholder={t('talk.placeholder')}
            max={replyMax}
            initial={editing.text}
            action={t('talk.save')}
            onSend={async (text) => {
              const landed = await onEdit(editing, text);
              if (landed) setEditing(null);
              return landed;
            }}
            onCancel={() => setEditing(null)}
          />
        ) : post.mine && authorMayAnswer(post) ? (
          <Answer
            t={t}
            label={t('talk.answerLabel', { app: appName })}
            placeholder={t('talk.placeholder')}
            max={replyMax}
            action={t('talk.send')}
            onSend={onSay}
          />
        ) : yours ? (
          <p class="note talk__next">{t('talk.next', { app: appName })}</p>
        ) : closed && thread.length > 0 ? (
          <p class="note talk__next">
            {t(post.status === 'done' ? 'talk.closedDone' : 'talk.closedDeclined', { app: appName })}
          </p>
        ) : null}
      </div>
    </>
  );
}
