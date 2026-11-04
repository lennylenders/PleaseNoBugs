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
  // A read-only board has no way to write, so it does not ask.
  'board.emptyRead': {
    en: 'Nothing here yet.',
    nl: 'Hier staat nog niets.',
    de: 'Hier steht noch nichts.',
  },
  'board.votes': { en: '{n} votes', nl: '{n} stemmen', de: '{n} Stimmen' },
  'board.voteOne': { en: '1 vote', nl: '1 stem', de: '1 Stimme' },
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
  // On a bug; an idea and a review each ask their own question.
  'board.placeholder': {
    en: 'What’s broken?',
    nl: 'Wat is er stuk?',
    de: 'Was ist kaputt?',
  },
  'board.placeholderIdea': {
    en: 'What’s missing?',
    nl: 'Wat mis je?',
    de: 'Was fehlt dir?',
  },
  'board.placeholderReview': {
    en: 'What do you think of {app}?',
    nl: 'Wat vind je van {app}?',
    de: 'Wie findest du {app}?',
  },
  'board.yourRating': { en: 'Your rating', nl: 'Jouw beoordeling', de: 'Deine Bewertung' },
  'board.public': {
    en: 'Everyone using {app} can see this.',
    nl: 'Iedereen die {app} gebruikt ziet dit.',
    de: 'Alle, die {app} nutzen, sehen das.',
  },
  'board.showName': { en: 'Show my name', nl: 'Mijn naam tonen', de: 'Meinen Namen zeigen' },
  'board.namePlaceholder': { en: 'Your name', nl: 'Je naam', de: 'Dein Name' },
  // The honest version. Anonymous means the name is not shown, never that the
  // wallet is not known: the daily limit and one vote per wallet both have to
  // ask who.
  'board.anonNote': {
    en: 'Your wallet address is never public, but the server uses it to track votes and daily limits.',
    nl: 'Je wallet-adres is nooit openbaar, maar de server gebruikt het voor stemmen en de daglimiet.',
    de: 'Deine Wallet-Adresse ist nie öffentlich, aber der Server nutzt sie für Stimmen und das Tageslimit.',
  },
  // ---- A screenshot ----
  'board.shotAdd': { en: 'Add screenshot', nl: 'Screenshot toevoegen', de: 'Screenshot hinzufügen' },
  'board.shotRemove': { en: 'Remove screenshot', nl: 'Screenshot weghalen', de: 'Screenshot entfernen' },
  // Said before somebody picks one, because a screenshot of a wallet app is
  // the easiest way to give away a balance without noticing. On a board that
  // shows screenshots, and the one for `screenshots="owners"`. The address
  // line is there because posting anonymously is undone by a picture of it.
  'board.shotNoteBoard': {
    en: 'Screenshots are public. Hide personal info and wallet addresses.',
    nl: 'Screenshots zijn openbaar. Verberg persoonlijke gegevens en wallet-adressen.',
    de: 'Screenshots sind öffentlich. Verdecke persönliche Daten und Wallet-Adressen.',
  },
  // Ticked under the picture itself, so the yes is about this one.
  'board.shotAgree': {
    en: 'Checked: everyone may see this.',
    nl: 'Gecheckt: iedereen mag dit zien.',
    de: 'Geprüft: Alle dürfen das sehen.',
  },
  'board.shotNote': {
    en: 'Only {app} sees it. Hide personal info and wallet addresses.',
    nl: 'Alleen {app} ziet hem. Verberg persoonlijke gegevens en wallet-adressen.',
    de: 'Nur {app} sieht ihn. Verdecke persönliche Daten und Wallet-Adressen.',
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
    en: 'Already on the board?',
    nl: 'Staat het er al?',
    de: 'Schon auf dem Board?',
  },
  'board.likeThisNote': {
    en: 'Vote instead of sending it again.',
    nl: 'Stem liever dan het nog een keer te sturen.',
    de: 'Stimm lieber ab, statt es noch mal zu schicken.',
  },
  // Seconding a lookalike instead of writing it again, which closes the form.
  'board.meToo': { en: 'Me too', nl: 'Ik ook', de: 'Ich auch' },
  'board.meTooDone': {
    en: 'Your vote is on it. Thank you.',
    nl: 'Je stem staat erop. Bedankt.',
    de: 'Deine Stimme ist drauf. Danke.',
  },
  'board.voted': { en: 'Voted', nl: 'Gestemd', de: 'Abgestimmt' },
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
  // On a board that approves posts first: it did arrive, it is just not up yet.
  'board.sentWaiting': {
    en: 'Thank you. It shows on the board once {app} approved it.',
    nl: 'Bedankt. Het komt op het bord zodra {app} het heeft goedgekeurd.',
    de: 'Danke. Es erscheint auf dem Board, sobald {app} es freigegeben hat.',
  },
  'board.waiting': { en: 'Waiting for approval', nl: 'Wacht op goedkeuring', de: 'Wartet auf Freigabe' },
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
  'board.approve': { en: 'Approve: put it on the board', nl: 'Goedkeuren: op het bord zetten', de: 'Freigeben: aufs Board stellen' },
  'board.unapprove': { en: 'Keep it waiting', nl: 'Laten wachten', de: 'Warten lassen' },
  'board.save': { en: 'Save', nl: 'Opslaan', de: 'Speichern' },
  'board.context': { en: 'Sent with', nl: 'Meegestuurd', de: 'Mitgeschickt' },

  // ---- Where a fix is ----
  // In the owner's sheet, once Done is picked. An idea is built, not fixed.
  'fix.title': { en: 'Fixed in', nl: 'Opgelost in', de: 'Behoben in' },
  'fix.titleIdea': { en: 'Built in', nl: 'Gebouwd in', de: 'Umgesetzt in' },
  'fix.version': { en: 'Version', nl: 'Versie', de: 'Version' },
  'fix.versionBad': {
    en: 'Letters, numbers and dots only, like 1.4.2.',
    nl: 'Alleen letters, cijfers en punten, zoals 1.4.2.',
    de: 'Nur Buchstaben, Ziffern und Punkte, etwa 1.4.2.',
  },
  'fix.link': { en: 'Link to the fix', nl: 'Link naar de oplossing', de: 'Link zum Fix' },
  'fix.linkNote': {
    en: 'A commit, pull request or release on github.com or gitlab.com.',
    nl: 'Een commit, pull request of release op github.com of gitlab.com.',
    de: 'Ein Commit, Pull Request oder Release auf github.com oder gitlab.com.',
  },
  'fix.linkBad': {
    en: 'That is not a link to a page on github.com or gitlab.com.',
    nl: 'Dat is geen link naar een pagina op github.com of gitlab.com.',
    de: 'Das ist kein Link zu einer Seite auf github.com oder gitlab.com.',
  },
  'fix.who': {
    en: 'Whoever reported this sees it on their board.',
    nl: 'Wie dit meldde, ziet het op het eigen bord.',
    de: 'Wer das gemeldet hat, sieht es auf dem eigenen Board.',
  },
  // On the card, for everybody.
  'fix.in': { en: 'Fixed in {version}', nl: 'Opgelost in {version}', de: 'Behoben in {version}' },
  'fix.inIdea': { en: 'Built in {version}', nl: 'Gebouwd in {version}', de: 'Umgesetzt in {version}' },
  // {site} is GitHub or GitLab, whichever the link goes to.
  'fix.view': { en: 'View on {site}', nl: 'Bekijk op {site}', de: 'Auf {site} ansehen' },

  // ---- The note for whoever reported it ----
  'news.bug': { en: 'Your bug is fixed', nl: 'Je bug is opgelost', de: 'Dein Bug ist behoben' },
  'news.bugIn': {
    en: 'Your bug is fixed in {version}',
    nl: 'Je bug is opgelost in {version}',
    de: 'Dein Bug ist behoben in {version}',
  },
  'news.idea': { en: 'Your idea is built', nl: 'Je idee is gebouwd', de: 'Deine Idee ist umgesetzt' },
  'news.ideaIn': { en: 'Your idea is in {version}', nl: 'Je idee zit in {version}', de: 'Deine Idee ist in {version}' },
  'news.see': { en: 'See the fix', nl: 'Bekijk de oplossing', de: 'Zum Fix' },

  // ---- The conversation under a post ----
  'talk.title': { en: 'Conversation', nl: 'Gesprek', de: 'Unterhaltung' },
  'talk.open': { en: 'Open the conversation', nl: 'Gesprek openen', de: 'Unterhaltung öffnen' },
  'talk.count': { en: '{n} messages', nl: '{n} berichten', de: '{n} Nachrichten' },
  'talk.you': { en: 'You say', nl: 'Jij zegt', de: 'Du sagst' },
  'talk.who': { en: '{who} says', nl: '{who} zegt', de: '{who} sagt' },
  'talk.edited': { en: 'edited', nl: 'aangepast', de: 'bearbeitet' },
  'talk.answerLabel': { en: 'Your answer to {app}', nl: 'Jouw antwoord aan {app}', de: 'Deine Antwort an {app}' },
  'talk.placeholder': { en: 'Write your answer…', nl: 'Schrijf je antwoord…', de: 'Schreib deine Antwort…' },
  'talk.send': { en: 'Send', nl: 'Versturen', de: 'Senden' },
  'talk.edit': { en: 'Edit', nl: 'Aanpassen', de: 'Bearbeiten' },
  'talk.remove': { en: 'Remove', nl: 'Weghalen', de: 'Entfernen' },
  'talk.save': { en: 'Save', nl: 'Opslaan', de: 'Speichern' },
  'talk.next': { en: '{app} answers next.', nl: '{app} antwoordt hierna.', de: '{app} antwortet als Nächstes.' },
  'talk.closedDone': {
    en: 'Closed: {app} marked this done.',
    nl: 'Gesloten: {app} heeft dit op Klaar gezet.',
    de: 'Geschlossen: {app} hat das auf Fertig gesetzt.',
  },
  'talk.closedDeclined': {
    en: 'Closed: {app} is not doing this.',
    nl: 'Gesloten: {app} doet dit niet.',
    de: 'Geschlossen: {app} macht das nicht.',
  },
  // Said when what was on screen is no longer what is on the board.
  'talk.moved': {
    en: 'Something changed in the meantime. Have a look first.',
    nl: 'Er is intussen iets veranderd. Kijk eerst even.',
    de: 'Inzwischen hat sich etwas geändert. Schau erst mal.',
  },
  'talk.hide': { en: 'Hide', nl: 'Verbergen', de: 'Ausblenden' },
  'talk.unhide': { en: 'Put back', nl: 'Terugzetten', de: 'Zurückstellen' },
  'talk.label': { en: 'Conversation', nl: 'Gesprek', de: 'Unterhaltung' },
  'talk.writeTo': { en: 'Write to {who}…', nl: 'Schrijf aan {who}…', de: 'Schreib an {who}…' },
  'talk.changeLast': { en: 'Change your last message', nl: 'Je laatste bericht aanpassen', de: 'Deine letzte Nachricht ändern' },
  'talk.gets': {
    en: '{who} gets a note on the board.',
    nl: '{who} krijgt een melding op het bord.',
    de: '{who} bekommt einen Hinweis auf dem Board.',
  },
  // How an owner's sheet names the author of an anonymous post.
  'talk.author': { en: 'the author', nl: 'de schrijver', de: 'die Person' },

  // ---- The note for whoever wrote it, once the app answered ----
  'answered.bug': { en: '{app} answered your bug', nl: '{app} heeft op je bug gereageerd', de: '{app} hat auf deinen Bug geantwortet' },
  'answered.idea': { en: '{app} answered your idea', nl: '{app} heeft op je idee gereageerd', de: '{app} hat auf deine Idee geantwortet' },
  'answered.review': {
    en: '{app} answered your review',
    nl: '{app} heeft op je review gereageerd',
    de: '{app} hat auf deine Bewertung geantwortet',
  },
  'answered.see': { en: 'See the conversation', nl: 'Bekijk het gesprek', de: 'Zur Unterhaltung' },

  // ---- For owners: answers waiting ----
  'owner.newAnswer': { en: 'New answer', nl: 'Nieuw antwoord', de: 'Neue Antwort' },
  'owner.waitingOne': { en: '1 answer waits for you', nl: '1 antwoord wacht op jou', de: '1 Antwort wartet auf dich' },
  'owner.waitingMany': { en: '{n} answers wait for you', nl: '{n} antwoorden wachten op jou', de: '{n} Antworten warten auf dich' },
  'owner.showThese': { en: 'Show only these', nl: 'Toon alleen deze', de: 'Nur diese zeigen' },

  // ---- Search and filter ----
  'search.placeholder': { en: 'Search bugs and ideas', nl: 'Zoek in bugs en ideeën', de: 'Bugs und Ideen durchsuchen' },
  'search.clear': { en: 'Clear the search', nl: 'Zoekopdracht wissen', de: 'Suche löschen' },
  'search.countOne': { en: '1 post matches "{q}"', nl: '1 post past bij "{q}"', de: '1 Post passt zu „{q}“' },
  'search.count': { en: '{n} posts match "{q}"', nl: '{n} posts passen bij "{q}"', de: '{n} Posts passen zu „{q}“' },
  'search.inThread': { en: 'In the conversation:', nl: 'In het gesprek:', de: 'In der Unterhaltung:' },
  'filter.button': { en: 'Filter', nl: 'Filter', de: 'Filter' },
  'filter.title': { en: 'Filter', nl: 'Filter', de: 'Filter' },
  'filter.kind': { en: 'Kind', nl: 'Soort', de: 'Art' },
  'filter.status': { en: 'Status', nl: 'Status', de: 'Status' },
  'filter.statusNote': {
    en: 'Reviews have no status, so choosing one hides them.',
    nl: 'Reviews hebben geen status, dus als je er een kiest verdwijnen ze.',
    de: 'Bewertungen haben keinen Status, also blendet eine Auswahl sie aus.',
  },
  'filter.own': { en: 'Only for you', nl: 'Alleen voor jou', de: 'Nur für dich' },
  'filter.waiting': { en: 'Waiting on you', nl: 'Wacht op jou', de: 'Wartet auf dich' },
  'filter.mine': { en: 'Only my posts', nl: 'Alleen mijn posts', de: 'Nur meine Posts' },
  'filter.reset': { en: 'Reset', nl: 'Wissen', de: 'Zurücksetzen' },
  'filter.showOne': { en: 'Show 1 post', nl: 'Toon 1 post', de: '1 Post zeigen' },
  'filter.show': { en: 'Show {n} posts', nl: 'Toon {n} posts', de: '{n} Posts zeigen' },
  'filter.on': { en: '{n} filters on', nl: '{n} filters aan', de: '{n} Filter an' },
  'filter.remove': { en: 'Turn off {label}', nl: '{label} uitzetten', de: '{label} ausschalten' },
  'filter.clearAll': { en: 'Clear all', nl: 'Alles wissen', de: 'Alles löschen' },
  'filter.none': { en: 'Nothing found', nl: 'Niets gevonden', de: 'Nichts gefunden' },
  'filter.noneNote': {
    en: 'Nothing matches your search and filters. Clear them to look everywhere.',
    nl: 'Niets past bij je zoekopdracht en filters. Wis ze om overal te zoeken.',
    de: 'Nichts passt zu deiner Suche und deinen Filtern. Lösch sie, um überall zu suchen.',
  },
  'filter.clear': { en: 'Clear search and filters', nl: 'Zoekopdracht en filters wissen', de: 'Suche und Filter löschen' },

  // ---- Updates ----
  'updates.title': { en: 'Updates', nl: 'Updates', de: 'Updates' },
  'updates.intro': {
    en: 'What changed in {app}. Tap one to see the change itself.',
    nl: 'Wat er veranderd is in {app}. Tik erop om de wijziging zelf te zien.',
    de: 'Was sich in {app} geändert hat. Tipp drauf, um die Änderung selbst zu sehen.',
  },
  'updates.empty': { en: 'No updates yet.', nl: 'Nog geen updates.', de: 'Noch keine Updates.' },
  'updates.emptyOwner': {
    en: 'No updates yet. Write the first one with +.',
    nl: 'Nog geen updates. Schrijf de eerste met +.',
    de: 'Noch keine Updates. Schreib das erste mit +.',
  },
  'updates.bugOne': { en: '1 bug', nl: '1 bug', de: '1 Bug' },
  'updates.bugMany': { en: '{n} bugs', nl: '{n} bugs', de: '{n} Bugs' },
  'updates.ideaOne': { en: '1 idea', nl: '1 idee', de: '1 Idee' },
  'updates.ideaMany': { en: '{n} ideas', nl: '{n} ideeën', de: '{n} Ideen' },
  'updates.fromBoard': { en: '{list} from this board', nl: '{list} van dit bord', de: '{list} von diesem Board' },
  'updates.write': { en: 'New update', nl: 'Nieuwe update', de: 'Neues Update' },
  'updates.titleLabel': { en: 'Title', nl: 'Titel', de: 'Titel' },
  'updates.titlePlaceholder': {
    en: 'What changed, in a few words',
    nl: 'Wat er veranderd is, in een paar woorden',
    de: 'Was sich geändert hat, in ein paar Worten',
  },
  'updates.link': { en: 'Link on GitHub or GitLab', nl: 'Link op GitHub of GitLab', de: 'Link auf GitHub oder GitLab' },
  'updates.linkNote': {
    en: 'Only github.com and gitlab.com links: a release, pull request or commit.',
    nl: 'Alleen links naar github.com of gitlab.com: een release, pull request of commit.',
    de: 'Nur Links zu github.com oder gitlab.com: ein Release, ein Pull Request oder ein Commit.',
  },
  'updates.textLabel': { en: 'What changed', nl: 'Wat er veranderd is', de: 'Was sich geändert hat' },
  'updates.textPlaceholder': {
    en: 'A few lines for the people using {app}',
    nl: 'Een paar regels voor wie {app} gebruikt',
    de: 'Ein paar Zeilen für alle, die {app} nutzen',
  },
  'updates.fixes': { en: 'What it fixes', nl: 'Wat het oplost', de: 'Was es behebt' },
  'updates.fixesNote': {
    en: 'Open and planned bugs and ideas. Ticked ones go to Done, with this version and link.',
    nl: 'Open en geplande bugs en ideeën. Aangevinkte gaan op Klaar, met deze versie en link.',
    de: 'Offene und geplante Bugs und Ideen. Angehakte gehen auf Fertig, mit dieser Version und diesem Link.',
  },
  'updates.fixesNone': {
    en: 'No open bugs or ideas on the board.',
    nl: 'Geen open bugs of ideeën op het bord.',
    de: 'Keine offenen Bugs oder Ideen auf dem Board.',
  },
  'updates.publish': { en: 'Publish update', nl: 'Update plaatsen', de: 'Update veröffentlichen' },
  'updates.delete': { en: 'Delete update', nl: 'Update verwijderen', de: 'Update löschen' },
  'updates.deleteTitle': { en: 'Delete this update?', nl: 'Deze update verwijderen?', de: 'Dieses Update löschen?' },
  'updates.deleteNote': {
    en: 'It leaves the Updates page. The posts it fixed stay Done.',
    nl: 'Hij verdwijnt van de Updates-pagina. De posts die hij oploste blijven op Klaar.',
    de: 'Es verschwindet von der Updates-Seite. Die Posts, die es behoben hat, bleiben auf Fertig.',
  },
  'updates.deleteBtn': { en: 'Delete', nl: 'Verwijderen', de: 'Löschen' },

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
