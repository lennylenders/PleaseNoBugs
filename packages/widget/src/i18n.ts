/**
 * Every word the widget says, in every language it speaks, side by side so a
 * string added in one language and not the others is a type error.
 *
 * Taken from Shitti's board, where the copy was written for the same two jobs
 * a feedback board has that the rest of an app does not: saying out loud that
 * this is public, and being honest about what "anonymous" does and does not
 * mean. "Shitti" became `{app}`, the project's own name.
 *
 * A developer can override any string, or speak a language this file does not,
 * through the element's `strings` property (see {@link translator}).
 */

export const LANGS = ['en', 'nl', 'de'] as const;
export type Lang = (typeof LANGS)[number];

const COPY = {
  'board.title': { en: 'Feedback', nl: 'Feedback', de: 'Feedback' },
  'board.open': { en: 'Feedback', nl: 'Feedback', de: 'Feedback' },
  'board.close': { en: 'Close', nl: 'Sluiten', de: 'Schließen' },
  'board.back': { en: 'Back', nl: 'Terug', de: 'Zurück' },
  'board.top': { en: 'Top', nl: 'Top', de: 'Top' },
  'board.new': { en: 'New', nl: 'Nieuw', de: 'Neu' },
  'board.order': { en: 'Order', nl: 'Volgorde', de: 'Reihenfolge' },
  'board.all': { en: 'All', nl: 'Alles', de: 'Alles' },
  'board.bugs': { en: 'Bugs', nl: 'Bugs', de: 'Bugs' },
  'board.ideas': { en: 'Ideas', nl: 'Ideeën', de: 'Ideen' },
  'board.reviews': { en: 'Reviews', nl: 'Reviews', de: 'Bewertungen' },
  'board.kindBug': { en: 'Bug', nl: 'Bug', de: 'Bug' },
  'board.kindIdea': { en: 'Idea', nl: 'Idee', de: 'Idee' },
  'board.kindReview': { en: 'Review', nl: 'Review', de: 'Bewertung' },
  'board.statusOpen': { en: 'Open', nl: 'Open', de: 'Offen' },
  'board.statusPlanned': { en: 'Planned', nl: 'Gepland', de: 'Geplant' },
  'board.statusDone': { en: 'Done', nl: 'Klaar', de: 'Fertig' },
  'board.statusDeclined': { en: 'Not doing', nl: 'Doen we niet', de: 'Machen wir nicht' },
  'board.anon': { en: 'Anonymous', nl: 'Anoniem', de: 'Anonym' },
  'board.byYou': { en: 'You', nl: 'Jij', de: 'Du' },
  // Named rather than "the owner": a board that answers in the third person
  // reads like a support desk.
  'board.reply': { en: '{app} says', nl: '{app} zegt', de: '{app} sagt' },
  'board.upvote': { en: 'I want this too', nl: 'Dit wil ik ook', de: 'Will ich auch' },
  // On a review there is nothing to want: you agree with it, or it helped.
  'board.helpful': { en: 'Helpful', nl: 'Nuttig', de: 'Hilfreich' },
  'board.stars': { en: '{n} of 5 stars', nl: '{n} van 5 sterren', de: '{n} von 5 Sternen' },
  'board.ratingOne': { en: '1 review', nl: '1 review', de: '1 Bewertung' },
  'board.ratingMany': { en: '{n} reviews', nl: '{n} reviews', de: '{n} Bewertungen' },
  'board.emptyTitle': {
    en: 'Nothing here yet. Tell us what is broken or what you miss.',
    nl: 'Hier staat nog niets. Vertel wat er stuk is of wat je mist.',
    de: 'Hier steht noch nichts. Sag uns, was kaputt ist oder was dir fehlt.',
  },
  'board.emptyFiltered': {
    en: 'Nothing of that kind yet.',
    nl: 'Nog niets van deze soort.',
    de: 'Von dieser Sorte noch nichts.',
  },
  'board.write': { en: 'Write feedback', nl: 'Feedback schrijven', de: 'Feedback schreiben' },
  'board.loadFailed': {
    en: 'Could not reach the board.',
    nl: 'Kon het bord niet bereiken.',
    de: 'Das Board war nicht erreichbar.',
  },
  'board.retry': { en: 'Try again', nl: 'Opnieuw', de: 'Nochmal' },
  'board.page': { en: 'Page {n}', nl: 'Pagina {n}', de: 'Seite {n}' },
  'board.signIn': {
    en: 'Sign in with your wallet',
    nl: 'Inloggen met je wallet',
    de: 'Mit deiner Wallet anmelden',
  },
  // Reading works anywhere; writing needs a wallet. Said when somebody tries,
  // not up front, so a reader is never told off for reading.
  'board.needWallet': {
    en: 'Open {app} in Nimiq Pay to post and vote.',
    nl: 'Open {app} in Nimiq Pay om te posten en te stemmen.',
    de: 'Öffne {app} in Nimiq Pay, um zu posten und abzustimmen.',
  },

  // ---- Choosing what to write ----
  'board.chooseTitle': {
    en: 'What do you want to share?',
    nl: 'Wat wil je delen?',
    de: 'Was möchtest du teilen?',
  },
  'board.tileBug': { en: 'Report a bug', nl: 'Bug melden', de: 'Fehler melden' },
  'board.tileBugNote': { en: 'Something does not work', nl: 'Iets werkt niet', de: 'Etwas funktioniert nicht' },
  'board.tileIdea': { en: 'Share an idea', nl: 'Idee delen', de: 'Idee teilen' },
  'board.tileIdeaNote': { en: 'Something you miss', nl: 'Iets wat je mist', de: 'Etwas, das dir fehlt' },
  'board.tileReview': { en: 'Write a review', nl: 'Review schrijven', de: 'Bewertung schreiben' },
  'board.tileReviewNote': {
    en: 'What you think of {app}',
    nl: 'Wat je van {app} vindt',
    de: 'Was du von {app} hältst',
  },
  'board.seeBoard': { en: 'See the board', nl: 'Bekijk het bord', de: 'Zum Board' },
  'board.tileReviewDone': {
    en: 'You reviewed {app} already',
    nl: 'Je hebt {app} al beoordeeld',
    de: 'Du hast {app} schon bewertet',
  },

  // ---- Writing one ----
  'board.composeTitle': { en: 'Your feedback', nl: 'Jouw feedback', de: 'Dein Feedback' },
  'board.whatKind': { en: 'What is it?', nl: 'Wat is het?', de: 'Was ist es?' },
  'board.placeholder': {
    en: 'What is broken, or what do you miss?',
    nl: 'Wat is er stuk, of wat mis je?',
    de: 'Was ist kaputt, oder was fehlt dir?',
  },
  'board.placeholderReview': {
    en: 'What do you like or dislike about {app}?',
    nl: 'Wat vind je goed of minder goed aan {app}?',
    de: 'Was gefällt dir an {app}, was nicht?',
  },
  'board.yourRating': { en: 'Your rating', nl: 'Jouw beoordeling', de: 'Deine Bewertung' },
  'board.public': {
    en: 'Everybody using {app} can read this.',
    nl: 'Iedereen die {app} gebruikt kan dit lezen.',
    de: 'Jeder, der {app} nutzt, kann das lesen.',
  },
  'board.showName': { en: 'Show my name', nl: 'Mijn naam tonen', de: 'Meinen Namen zeigen' },
  'board.namePlaceholder': { en: 'Your name', nl: 'Je naam', de: 'Dein Name' },
  // The honest version. Anonymous means the name is not shown, never that the
  // wallet is not known: the daily limit and one vote per wallet both have to
  // ask who.
  'board.anonNote': {
    en: 'Nobody on the board sees who wrote it, and your wallet address is never shown. The server does know your wallet: votes and the daily limit are counted per wallet.',
    nl: 'Niemand op het bord ziet wie het schreef, en je wallet-adres wordt nooit getoond. De server kent je wallet wel: stemmen en de daglimiet tellen per wallet.',
    de: 'Niemand auf dem Board sieht, wer es geschrieben hat, und deine Wallet-Adresse wird nie gezeigt. Der Server kennt deine Wallet schon: Stimmen und das Tageslimit zählen pro Wallet.',
  },
  // ---- A screenshot ----
  'board.shotAdd': { en: 'Add a screenshot', nl: 'Screenshot toevoegen', de: 'Screenshot hinzufügen' },
  'board.shotRemove': { en: 'Remove screenshot', nl: 'Screenshot weghalen', de: 'Screenshot entfernen' },
  // Said before somebody picks one, because a screenshot of a wallet app is
  // the easiest way to give away a balance without noticing. On a board that
  // shows screenshots, and the one for `screenshots="owners"`. The address
  // line is there because posting anonymously is undone by a picture of it.
  'board.shotNoteBoard': {
    en: 'Everyone who views the board sees it. Check it shows nothing private, like a balance, an address or a name. An address on it shows it was you, even if you post anonymously.',
    nl: 'Iedereen die het bord bekijkt ziet hem. Kijk of er niets privés op staat, zoals een saldo, een adres of een naam. Een adres erop laat zien dat jij het was, ook als je anoniem post.',
    de: 'Jeder, der das Board ansieht, sieht ihn. Prüf, dass nichts Privates drauf ist, etwa ein Kontostand, eine Adresse oder ein Name. Eine Adresse darauf zeigt, dass du es warst, auch wenn du anonym postest.',
  },
  // Ticked under the picture itself, so the yes is about this one.
  'board.shotAgree': {
    en: 'I checked it: everyone may see this screenshot.',
    nl: 'Ik heb gekeken: iedereen mag deze screenshot zien.',
    de: 'Ich hab nachgesehen: Jeder darf diesen Screenshot sehen.',
  },
  'board.shotNote': {
    en: 'Only {app} sees it, not the board. Check it shows nothing private, like a balance or an address.',
    nl: 'Alleen {app} ziet hem, het bord niet. Kijk of er niets privés op staat, zoals een saldo of adres.',
    de: 'Nur {app} sieht ihn, nicht das Board. Prüf, dass nichts Privates drauf ist, etwa ein Kontostand oder eine Adresse.',
  },
  'board.shotFailed': {
    en: 'That image could not be read. Try another one.',
    nl: 'Die afbeelding kon niet gelezen worden. Probeer een andere.',
    de: 'Das Bild ließ sich nicht lesen. Versuch ein anderes.',
  },
  'board.shot': { en: 'Screenshot', nl: 'Screenshot', de: 'Screenshot' },
  'board.shotOpen': { en: 'Open the screenshot', nl: 'Screenshot openen', de: 'Screenshot öffnen' },
  // In the owner's sheet: who sees it now, before what happens to it.
  'board.shotForBoard': {
    en: 'On the board for everyone.',
    nl: 'Voor iedereen op het bord.',
    de: 'Für alle auf dem Board.',
  },
  'board.shotForOff': {
    en: 'Off the board: only you see it.',
    nl: 'Van het bord: alleen jij ziet hem.',
    de: 'Vom Board genommen: Nur du siehst ihn.',
  },
  'board.shotForOwners': {
    en: 'Only you see it: it was sent for your eyes only.',
    nl: 'Alleen jij ziet hem: hij is alleen voor jou gestuurd.',
    de: 'Nur du siehst ihn: Er wurde nur für dich geschickt.',
  },
  'board.shotOff': {
    en: 'Take the screenshot off the board',
    nl: 'Screenshot van het bord halen',
    de: 'Screenshot vom Board nehmen',
  },
  'board.shotOn': {
    en: 'Put the screenshot back',
    nl: 'Screenshot terugzetten',
    de: 'Screenshot zurückstellen',
  },
  'board.shotGoes': {
    en: 'Deleted by itself when you mark this Done or Not doing.',
    nl: 'Wordt vanzelf verwijderd als je dit op Klaar of Doen we niet zet.',
    de: 'Wird von selbst gelöscht, wenn du es auf Fertig oder Machen wir nicht setzt.',
  },
  'board.shotGone': {
    en: 'The screenshot could not be loaded.',
    nl: 'De screenshot kon niet geladen worden.',
    de: 'Der Screenshot ließ sich nicht laden.',
  },

  'board.send': { en: 'Put it on the board', nl: 'Op het bord zetten', de: 'Aufs Board setzen' },
  'board.left': {
    en: '{n} of {max} left today',
    nl: 'Nog {n} van {max} vandaag',
    de: 'Noch {n} von {max} heute',
  },
  'board.noneLeft': {
    en: 'That is today’s {max}. Back tomorrow.',
    nl: 'Dat waren de {max} van vandaag. Morgen weer.',
    de: 'Das waren die {max} für heute. Morgen wieder.',
  },
  'board.likeThis': {
    en: 'Said already, maybe?',
    nl: 'Misschien al gezegd?',
    de: 'Vielleicht schon gesagt?',
  },
  'board.likeThisNote': {
    en: 'Back one of these instead and it counts for more.',
    nl: 'Steun er liever een van deze, dan telt het zwaarder.',
    de: 'Unterstütz lieber eins davon, dann zählt es mehr.',
  },
  // Two ways a post can be refused, because the answer to one is "go again"
  // and the answer to the other is "come back tomorrow".
  'board.failed': {
    en: 'That did not go through. Try again.',
    nl: 'Dat ging niet door. Probeer het opnieuw.',
    de: 'Das ist nicht durchgegangen. Versuch es noch mal.',
  },
  'board.failedFull': {
    en: 'Not posted: that was today’s {max}. Back tomorrow.',
    nl: 'Niet geplaatst: dat waren de {max} van vandaag. Morgen weer.',
    de: 'Nicht gepostet: das waren die {max} für heute. Morgen wieder.',
  },
  'board.reviewed': {
    en: 'You reviewed {app} already. Throw yours away to write a new one.',
    nl: 'Je hebt {app} al beoordeeld. Gooi de jouwe weg om een nieuwe te schrijven.',
    de: 'Du hast {app} schon bewertet. Wirf deine weg, um eine neue zu schreiben.',
  },
  'board.sent': { en: 'Feedback sent!', nl: 'Feedback verstuurd!', de: 'Feedback gesendet!' },
  'board.sentNote': {
    en: 'Thank you. It is on the board now.',
    nl: 'Bedankt. Het staat nu op het bord.',
    de: 'Danke. Es steht jetzt auf dem Board.',
  },
  'board.sentBack': { en: 'Back to the board', nl: 'Terug naar het bord', de: 'Zurück zum Board' },

  // ---- Throwing your own away ----
  'board.delete': { en: 'Throw away', nl: 'Weggooien', de: 'Wegwerfen' },
  'board.deleteTitle': { en: 'Throw this away?', nl: 'Deze weggooien?', de: 'Das hier wegwerfen?' },
  'board.deleteNote': {
    en: 'It leaves the board for everybody, with its votes.',
    nl: 'Hij gaat voor iedereen van het bord, met stemmen en al.',
    de: 'Es verschwindet für alle vom Board, samt Stimmen.',
  },
  'board.cancel': { en: 'Cancel', nl: 'Annuleren', de: 'Abbrechen' },

  // ---- Answering one (owners only) ----
  'board.manage': { en: 'Answer this', nl: 'Hier antwoord op geven', de: 'Darauf antworten' },
  'board.setStatus': { en: 'Where it stands', nl: 'Waar het staat', de: 'Wo es steht' },
  'board.replyLabel': { en: 'Your answer', nl: 'Jouw antwoord', de: 'Deine Antwort' },
  'board.replyPlaceholder': { en: 'Say something back', nl: 'Zeg er iets over', de: 'Sag was dazu' },
  'board.hide': { en: 'Take off the board', nl: 'Van het bord halen', de: 'Vom Board nehmen' },
  'board.unhide': { en: 'Put it back', nl: 'Terugzetten', de: 'Zurückstellen' },
  'board.hidden': { en: 'Off the board', nl: 'Van het bord', de: 'Vom Board' },
  'board.save': { en: 'Save', nl: 'Opslaan', de: 'Speichern' },
  'board.context': { en: 'Sent with', nl: 'Meegestuurd', de: 'Mitgeschickt' },

  // ---- When ----
  'time.now': { en: 'just now', nl: 'zojuist', de: 'gerade eben' },
  'time.min': { en: '{n}m ago', nl: '{n}m geleden', de: 'vor {n} Min.' },
  'time.hour': { en: '{n}h ago', nl: '{n}u geleden', de: 'vor {n} Std.' },
  'time.day': { en: '{n}d ago', nl: '{n}d geleden', de: 'vor {n} Tg.' },
} satisfies Record<string, Record<Lang, string>>;

export type CopyKey = keyof typeof COPY;
export type Strings = Partial<Record<CopyKey, string>>;
export type Translate = (key: CopyKey, vars?: Record<string, string | number>) => string;

/**
 * The language to speak, best guess first: what the element was told, then
 * what Nimiq Pay says the user picked, then the page, then the browser.
 * Anything this file does not speak falls back to English, unless the
 * developer supplied `strings` for it, in which case it is kept.
 *
 * @example
 * pickLang('nl-BE')   // → 'nl'
 */
export function pickLang(asked?: string | null): string {
  const candidates = [
    asked,
    typeof window !== 'undefined' ? window.nimiqPay?.language : undefined,
    typeof document !== 'undefined' ? document.documentElement.lang : undefined,
    typeof navigator !== 'undefined' ? navigator.language : undefined,
  ];
  for (const c of candidates) {
    if (c) return c.slice(0, 2).toLowerCase();
  }
  return 'en';
}

/**
 * A `t()` for one language with one set of overrides.
 *
 * Overrides win, then the language, then English, so a developer adding French
 * may translate half the keys and still never show a hole.
 *
 * @example
 * const t = translator('nl', { 'board.title': 'Ideeënbus' });
 * t('board.title')                    // → 'Ideeënbus'
 * t('board.reply', { app: 'Shitti' }) // → 'Shitti zegt'
 */
export function translator(lang: string, strings: Strings = {}): Translate {
  const known = (LANGS as readonly string[]).includes(lang) ? (lang as Lang) : 'en';
  return (key, vars) => {
    let text = strings[key] ?? COPY[key][known] ?? COPY[key].en;
    if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
    return text;
  };
}
