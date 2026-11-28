import { useEffect, useRef, useState } from 'preact/hooks';
import { NAME_MAX, type Me } from '@pleasenobugs/core';
import type { Translate } from '../i18n.js';
import { Face } from './Face.js';
import * as Icon from './icons.js';

/** How long the name waits after the last key before it saves itself, and how long "Saved" stays. */
const SAVE_AFTER_MS = 700;
const SAVED_MS = 2000;

/**
 * Your settings, behind your identicon: how others see you, and leaving.
 *
 * **A page of groups of rows**, so it grows by a row at a time: a group has a
 * heading and a card, a row a label and its control. Today that is Profile
 * (your name, posting anonymously) and Account (Log out); tomorrow a
 * language or notifications is one more row, not a new screen.
 *
 * **The name saves itself**, a moment after the last key and on leaving the
 * field, with "Saved" beside its label: a Save button on one field is a step
 * people forget. Empty is allowed and means "no name": others then see a
 * short address.
 *
 * **Posting anonymously is set here once**, not on every post. It lives in
 * this browser (see `prefs.ts`); the server only ever hears it as the
 * `anon` on each post.
 *
 * **Log out only where there is something to log out of**: in a browser,
 * where the widget signed in itself. Inside Nimiq Pay the wallet is the
 * app's, and stays.
 */
export function Settings({
  t,
  me,
  faceUrl,
  names,
  anon,
  canLogOut,
  onAnon,
  onName,
  onLogOut,
  onBack,
}: {
  t: Translate;
  me: Me;
  faceUrl?: (code: string) => string;
  /** Whether this board lets anybody show a name. Without it every post is anonymous. */
  names: boolean;
  anon: boolean;
  canLogOut: boolean;
  onAnon: (anon: boolean) => void;
  /** Resolves whether the name was saved. */
  onName: (name: string) => Promise<boolean>;
  onLogOut: () => void;
  onBack: () => void;
}) {
  const [name, setName] = useState(me.name ?? '');
  const [saved, setSaved] = useState(false);
  const lastSaved = useRef(me.name ?? '');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const hidden = anon || !names;
  const src = me.face && faceUrl ? faceUrl(me.face) : undefined;

  const save = async (value = name) => {
    clearTimeout(timer.current);
    const clean = value.trim();
    if (clean === lastSaved.current) return;
    if (await onName(clean)) {
      lastSaved.current = clean;
      setSaved(true);
    }
  };

  useEffect(() => {
    if (!saved) return;
    const id = setTimeout(() => setSaved(false), SAVED_MS);
    return () => clearTimeout(id);
  }, [saved]);
  // A name typed and left before it saved is still saved.
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div class="app">
      <header class="bar">
        <button type="button" class="icon-btn" aria-label={t('board.back')} onClick={() => void save().then(onBack)}>
          <Icon.Back />
        </button>
        <h2 class="bar__title bar__title--write">{t('settings.title')}</h2>
        <span />
      </header>
      <div class="scroll settings" style={{ paddingBottom: 'calc(24px + var(--_bottom))' }}>
        <div class="settings__who">
          <span class={hidden ? 'settings__face settings__face--off' : 'settings__face'}>
            <Face code={me.face} src={src} size={64} />
          </span>
          <strong class="settings__name">
            {hidden ? t('board.anon') : lastSaved.current || me.short || ''}
          </strong>
          <span class="settings__sub">
            {hidden ? t(names ? 'settings.hidden' : 'settings.namesOff') : lastSaved.current ? me.short : ''}
          </span>
        </div>

        {names && (
          <section class="settings__group" aria-labelledby="pnb-set-profile">
            <h3 class="settings__head" id="pnb-set-profile">
              {t('settings.profile')}
            </h3>
            <div class="settings__card">
              <div class={`settings__block${anon ? ' settings__block--off' : ''}`}>
                <span class="settings__label-row">
                  <label class="settings__label" for="pnb-set-name">
                    {t('settings.name')}
                  </label>
                  {saved && (
                    <span class="settings__saved" role="status">
                      <Icon.Tick />
                      {t('settings.saved')}
                    </span>
                  )}
                </span>
                <span class="name-field">
                  <Face code={me.face} src={src} size={24} />
                  <input
                    id="pnb-set-name"
                    class="input"
                    value={name}
                    maxLength={NAME_MAX}
                    disabled={anon}
                    placeholder={t('board.namePlaceholder')}
                    onInput={(e) => {
                      const v = (e.target as HTMLInputElement).value;
                      setName(v);
                      clearTimeout(timer.current);
                      timer.current = setTimeout(() => void save(v), SAVE_AFTER_MS);
                    }}
                    onBlur={() => void save()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void save();
                    }}
                  />
                </span>
                <span class="note">{t(anon ? 'settings.nameOff' : 'settings.nameNote')}</span>
              </div>
              <div class="settings__row">
                <span class="settings__row-label" id="pnb-set-anon">
                  {t('settings.anon')}
                </span>
                <button
                  type="button"
                  role="switch"
                  class="switch"
                  aria-checked={anon}
                  aria-labelledby="pnb-set-anon"
                  onClick={() => onAnon(!anon)}
                />
              </div>
            </div>
            <p class="note settings__note">{t(anon ? 'settings.anonOnNote' : 'settings.anonNote')}</p>
          </section>
        )}

        {canLogOut && (
          <section class="settings__group" aria-labelledby="pnb-set-account">
            <h3 class="settings__head" id="pnb-set-account">
              {t('settings.account')}
            </h3>
            <div class="settings__card">
              <button type="button" class="settings__row settings__row--danger" onClick={onLogOut}>
                <Icon.LogOut />
                <span class="settings__row-label">{t('settings.logOut')}</span>
              </button>
            </div>
            <p class="note settings__note">{t('settings.logOutNote')}</p>
          </section>
        )}
      </div>
    </div>
  );
}
