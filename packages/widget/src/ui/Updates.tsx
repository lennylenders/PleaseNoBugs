import { useEffect, useState } from 'preact/hooks';
import {
  LINK_MAX,
  UPDATE_TEXT_MAX,
  UPDATE_TITLE_MAX,
  VERSION_MAX,
  cleanCodeLink,
  codeSite,
  cleanVersion,
  type Post,
  type Update,
} from '@pleasenobugs/core';
import type { Client } from '../client.js';
import type { CopyKey, Translate } from '../i18n.js';
import { whenLabel } from '../when.js';
import { Badge, KIND, SiteMark } from './PostCard.js';
import { DeleteSheet } from './Sheets.js';
import * as Icon from './icons.js';

/** What an owner writes; the id is minted by whoever sends it. */
export interface UpdateDraft {
  title: string;
  text?: string;
  version?: string;
  link: string;
  posts: string[];
}

/**
 * The Updates page: what changed in the app, newest first, each one a tap
 * away from where it is on GitHub or GitLab. Anybody's to read, like the board.
 *
 * **The whole card is the link**, because that is the one thing to do with
 * an update; a link-shaped corner of it would be a smaller target for the
 * same tap. An owner gets a bin beside it, outside the link, and a + to write
 * one.
 *
 * Read when it opens, and not before: the board already said how many there
 * are, which is all the button needed.
 */
export function Updates({
  client,
  t,
  locale,
  appName,
  owner,
  posts,
  onBack,
  onPublish,
  onFail,
}: {
  client: Client;
  t: Translate;
  locale: string;
  appName: string;
  owner: boolean;
  /** The board's posts: what an update fixed is counted from these, and picked from them. */
  posts: Post[];
  onBack: () => void;
  /** Answers whether it went through. */
  onPublish: (draft: UpdateDraft) => Promise<boolean>;
  onFail: (error: string) => void;
}) {
  const [list, setList] = useState<Update[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [writing, setWriting] = useState(false);
  const [removing, setRemoving] = useState<Update | null>(null);

  const load = async () => {
    const res = await client.updates();
    if (res.ok) {
      setList(res.data.updates);
      setFailed(false);
    } else {
      setFailed(true);
    }
  };

  useEffect(() => {
    void load();
  }, [client]);

  const remove = async (u: Update) => {
    setRemoving(null);
    setList((l) => (l ? l.filter((x) => x.id !== u.id) : l));
    const res = await client.removeUpdate(u.id);
    if (!res.ok) onFail(res.error);
    void load();
  };

  if (writing) {
    return (
      <WriteUpdate
        t={t}
        appName={appName}
        posts={posts}
        onBack={() => setWriting(false)}
        onPublish={async (draft) => {
          const sent = await onPublish(draft);
          if (sent) {
            setWriting(false);
            await load();
          }
        }}
      />
    );
  }

  return (
    <>
      <header class="bar">
        <button type="button" class="icon-btn" aria-label={t('board.back')} onClick={onBack}>
          <Icon.Back />
        </button>
        <h2 class="bar__title">{t('updates.title')}</h2>
        {owner ? (
          <button type="button" class="icon-btn" aria-label={t('updates.write')} onClick={() => setWriting(true)}>
            <Icon.Plus />
          </button>
        ) : (
          <span />
        )}
      </header>

      <div class="scroll" style={{ paddingBottom: '24px' }}>
        {failed && !list ? (
          <div class="empty">
            <p>{t('board.loadFailed')}</p>
            <button type="button" class="text-btn" onClick={() => void load()}>
              {t('board.retry')}
            </button>
          </div>
        ) : !list ? (
          <div class="empty" aria-busy="true">
            <span class="spinner" style={{ display: 'inline-block' }} />
          </div>
        ) : list.length === 0 ? (
          <p class="empty">{t(owner ? 'updates.emptyOwner' : 'updates.empty')}</p>
        ) : (
          <>
            <p class="updates__intro">{t('updates.intro', { app: appName })}</p>
            <ul class="list">
              {list.map((u) => (
                <UpdateCard
                  key={u.id}
                  update={u}
                  posts={posts}
                  t={t}
                  locale={locale}
                  onDelete={owner ? () => setRemoving(u) : undefined}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      {removing && (
        <DeleteSheet
          t={t}
          title="updates.deleteTitle"
          note="updates.deleteNote"
          confirm="updates.deleteBtn"
          onConfirm={() => void remove(removing)}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  );
}

/** "2 bugs, 1 idea from this board", from the posts the board still has. */
function fixedLabel(update: Update, posts: Post[], t: Translate): string | null {
  const named = new Set(update.posts);
  const of = (kind: 'bug' | 'idea') => posts.filter((p) => p.kind === kind && named.has(p.id)).length;
  const parts: string[] = [];
  const count = (n: number, one: CopyKey, many: CopyKey) => {
    if (n) parts.push(n === 1 ? t(one) : t(many, { n }));
  };
  count(of('bug'), 'updates.bugOne', 'updates.bugMany');
  count(of('idea'), 'updates.ideaOne', 'updates.ideaMany');
  return parts.length ? t('updates.fromBoard', { list: parts.join(', ') }) : null;
}

function UpdateCard({
  update,
  posts,
  t,
  locale,
  onDelete,
}: {
  update: Update;
  posts: Post[];
  t: Translate;
  locale: string;
  onDelete?: () => void;
}) {
  const when = whenLabel(update.at, locale);
  const fixed = fixedLabel(update, posts, t);
  // Checked again here, whatever the server sent: a card that is a link has
  // to go where it says.
  const href = cleanCodeLink(update.link);
  const site = codeSite(update.link);
  const body = (
    <>
      <div class="update__head">
        {update.version && <span class="update__version">{update.version}</span>}
        <span class="card__when">{'date' in when ? when.date : t(when.key, when.vars)}</span>
      </div>
      <h3 class="update__title">{update.title}</h3>
      {update.text && <p class="update__text">{update.text}</p>}
      {fixed && (
        <div class="update__fixed">
          <Badge tone="done" icon={() => <Icon.Done />} label={t('board.statusDone')} />
          <span>{fixed}</span>
        </div>
      )}
    </>
  );

  return (
    <li class="update">
      {href && site ? (
        <a class="update__link" href={href} target="_blank" rel="noopener noreferrer">
          {body}
          <span class="code-link">
            <SiteMark site={site} />
            <span>{t('fix.view', { site })}</span>
            <Icon.Out size={12} />
          </span>
        </a>
      ) : (
        <div class="update__link">{body}</div>
      )}
      {onDelete && (
        <button type="button" class="icon-btn update__bin" aria-label={t('updates.delete')} onClick={onDelete}>
          <Icon.Trash />
        </button>
      )}
    </li>
  );
}

/**
 * An owner writing an update: a title, a version, the link, a few lines, and
 * which of the board's open bugs and ideas it fixes. Ticking one is the whole
 * of marking it done: it gets this version and link, and its author the news.
 *
 * Publish waits for a title and a link that really is on GitHub or GitLab, and says
 * so under the link rather than after a round trip.
 */
function WriteUpdate({
  t,
  appName,
  posts,
  onBack,
  onPublish,
}: {
  t: Translate;
  appName: string;
  posts: Post[];
  onBack: () => void;
  onPublish: (draft: UpdateDraft) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [link, setLink] = useState('');
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const cleanVer = cleanVersion(version);
  const cleanLink = cleanCodeLink(link);
  // What an update can fix: a bug or an idea that is not done yet, and that
  // anybody can see. The most wanted first.
  const open = posts
    .filter((p) => (p.kind === 'bug' || p.kind === 'idea') && (p.status === 'open' || p.status === 'planned'))
    .filter((p) => !p.hidden && !p.pending)
    .sort((a, b) => b.votes - a.votes);
  const ready = !!title.trim() && cleanVer !== null && !!cleanLink && !sending;

  const publish = async () => {
    if (!ready || !cleanLink) return;
    setSending(true);
    await onPublish({
      title: title.trim(),
      ...(text.trim() ? { text: text.trim() } : {}),
      ...(cleanVer ? { version: cleanVer } : {}),
      link: cleanLink,
      posts: picked,
    });
    setSending(false);
  };

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <>
      <header class="bar">
        <button type="button" class="icon-btn" aria-label={t('board.back')} onClick={onBack}>
          <Icon.Back />
        </button>
        <h2 class="bar__title">{t('updates.write')}</h2>
        <span />
      </header>

      <div class="scroll" style={{ paddingBottom: '24px' }}>
        <div class="compose">
          <p class="public" style={{ marginTop: 0 }}>
            {t('board.public', { app: appName })}
          </p>

          <label class="label" for="pnb-update-title">
            {t('updates.titleLabel')}
          </label>
          <input
            id="pnb-update-title"
            class="input"
            value={title}
            maxLength={UPDATE_TITLE_MAX}
            placeholder={t('updates.titlePlaceholder')}
            onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
          />

          <label class="label" for="pnb-update-version">
            {t('fix.version')}
          </label>
          <input
            id="pnb-update-version"
            class="input"
            value={version}
            maxLength={VERSION_MAX}
            placeholder="1.4.2"
            autocomplete="off"
            aria-invalid={cleanVer === null}
            onInput={(e) => setVersion((e.target as HTMLInputElement).value)}
          />
          {cleanVer === null && <p class="note note--bad">{t('fix.versionBad')}</p>}

          <label class="label" for="pnb-update-link">
            {t('updates.link')}
          </label>
          <input
            id="pnb-update-link"
            class="input"
            type="url"
            inputMode="url"
            value={link}
            maxLength={LINK_MAX}
            placeholder="github.com/…/releases/tag/v1.4.2"
            autocomplete="off"
            aria-invalid={cleanLink === null}
            onInput={(e) => setLink((e.target as HTMLInputElement).value)}
          />
          <p class={`note${cleanLink === null ? ' note--bad' : ''}`}>
            {t(cleanLink === null ? 'fix.linkBad' : 'updates.linkNote')}
          </p>

          <label class="label" for="pnb-update-text">
            {t('updates.textLabel')}
          </label>
          <textarea
            id="pnb-update-text"
            class="field"
            style={{ minHeight: '96px' }}
            value={text}
            maxLength={UPDATE_TEXT_MAX}
            placeholder={t('updates.textPlaceholder', { app: appName })}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          />

          <span class="label">{t('updates.fixes')}</span>
          {open.length === 0 ? (
            <p class="note">{t('updates.fixesNone')}</p>
          ) : (
            <>
              <ul class="picks">
                {open.map((p) => (
                  <li key={p.id}>
                    <label class="pick">
                      <input type="checkbox" checked={picked.includes(p.id)} onChange={() => toggle(p.id)} />
                      <Badge tone={p.kind} icon={KIND[p.kind].icon} label={t(KIND[p.kind].label)} />
                      <span class="pick__text">{p.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p class="note">{t('updates.fixesNote')}</p>
            </>
          )}

          <div class="send">
            <button type="button" class="btn" disabled={!ready} onClick={() => void publish()}>
              {sending ? <span class="spinner" /> : t('updates.publish')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
