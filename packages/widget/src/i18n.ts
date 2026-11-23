/**
 * Every word the widget says, in English.
 *
 * Taken from the board of the app PleaseNoBugs grew out of, where the copy
 * was written for the same two jobs a feedback board has that the rest of an
 * app does not: saying out loud that this is public, and being honest about
 * what "anonymous" does and does not mean. That app's name became `{app}`,
 * the project's own name.
 *
 * The widget ships in English only. A developer can override any string, or
 * put the whole board in their app's language, through the element's
 * `strings` property (see {@link translator}), with `lang` set to that
 * language so dates are written in it too.
 */

const COPY = {
  'board.title': 'Feedback',
  'board.open': 'Feedback',
  'board.close': 'Close',
  'board.back': 'Back',
  'board.top': 'Top',
  'board.new': 'New',
  'board.order': 'Order',
  'board.all': 'All',
  'board.bugs': 'Bugs',
  'board.ideas': 'Ideas',
  'board.reviews': 'Reviews',
  'board.kindBug': 'Bug',
  'board.kindIdea': 'Idea',
  'board.kindReview': 'Review',
  'board.statusOpen': 'Open',
  'board.statusPlanned': 'Planned',
  'board.statusDone': 'Done',
  // A bug is fixed, an idea done: 'done' says which by the kind (doneLabel in PostCard).
  'board.statusFixed': 'Fixed',
  'board.statusFixedOrDone': 'Fixed or done',
  'board.statusFixedAndDone': 'Fixed & done',
  'board.statusDeclined': 'Not doing',
  'board.anon': 'Anonymous',
  'board.byYou': 'You',
  // Named rather than "the owner": a board that answers in the third person
  // reads like a support desk.
  'board.reply': '{app} says',
  'board.upvote': 'I want this too',
  // On a review there is nothing to want: you agree with it, or it helped.
  'board.helpful': 'Helpful',
  'board.stars': '{n} of 5 stars',
  'board.ratingOne': '1 review',
  'board.ratingMany': '{n} reviews',
  'board.emptyTitle': 'Nothing here yet. Tell us what is broken or what you miss.',
  // A read-only board has no way to write, so it does not ask.
  'board.emptyRead': 'Nothing here yet.',
  'board.votes': '{n} votes',
  'board.voteOne': '1 vote',
  'board.emptyFiltered': 'Nothing of that kind yet.',
  'board.write': 'Write feedback',
  'board.loadFailed': 'Could not reach the board.',
  'board.retry': 'Try again',
  'board.page': 'Page {n}',
  'board.signIn': 'Sign in with your wallet',
  // On top of the board where signing in is a step of its own (outside Nimiq
  // Pay: a wallet window opens). Says what signing is not, before it is asked.
  'board.signInTitle': 'Sign in to post and vote',
  'board.signInNote': 'Use your Nimiq wallet. Signing only shows which wallet you are; it can’t move funds.',
  'board.signInButton': 'Sign in with Nimiq',
  // Reading works anywhere; writing needs a wallet. Said when somebody tries,
  // not up front, so a reader is never told off for reading.
  'board.needWallet': 'Open {app} in Nimiq Pay to post and vote.',

  // ---- Choosing what to write ----
  'board.chooseTitle': 'What do you want to share?',
  'board.tileBug': 'Report a bug',
  'board.tileBugNote': 'Something does not work',
  'board.tileIdea': 'Share an idea',
  'board.tileIdeaNote': 'Something you miss',
  'board.tileReview': 'Write a review',
  'board.tileReviewNote': 'What you think of {app}',
  'board.seeBoard': 'See the board',
  'board.tileReviewDone': 'You reviewed {app} already',

  // ---- Writing one ----
  'board.composeTitle': 'Your feedback',
  'board.whatKind': 'What is it?',
  // On a bug; an idea and a review each ask their own question.
  'board.placeholder': 'What’s broken?',
  'board.placeholderIdea': 'What’s missing?',
  'board.placeholderReview': 'What do you think of {app}?',
  'board.yourRating': 'Your rating',
  'board.public': 'Everyone using {app} can see this.',
  'board.postAnon': 'Post anonymously',
  'board.namePlaceholder': 'Your name',
  // Under the name field: what others see, and that a new name reaches back.
  'board.namedNote':
    'Others see your identicon and this name, never your address. Changing the name changes it on your earlier posts too.',
  // The honest version. Anonymous means the name is not shown, never that the
  // wallet is not known: the daily limit and one vote per wallet both have to
  // ask who.
  'board.anonNote':
    'Anonymous: no name, no identicon. Your address is never shown; the server uses it only to count votes and daily posts.',
  // ---- A screenshot ----
  'board.shotAdd': 'Add screenshot',
  'board.shotRemove': 'Remove screenshot',
  // Said before somebody picks one, because a screenshot of a wallet app is
  // the easiest way to give away a balance without noticing. On a board that
  // shows screenshots, and the one for `screenshots="owners"`. The address
  // line is there because posting anonymously is undone by a picture of it.
  'board.shotNoteBoard': 'Screenshots are public. Hide personal info and wallet addresses.',
  // Ticked under the picture itself, so the yes is about this one.
  'board.shotAgree': 'Checked: everyone may see this.',
  'board.shotNote': 'Only {app} sees it. Hide personal info and wallet addresses.',
  'board.shotFailed': 'That image could not be read. Try another one.',
  'board.shot': 'Screenshot',
  'board.shotOpen': 'Open the screenshot',
  // In the owner's sheet: who sees it now, before what happens to it.
  'board.shotForBoard': 'On the board for everyone.',
  'board.shotForOff': 'Off the board: only you see it.',
  'board.shotForOwners': 'Only you see it: it was sent for your eyes only.',
  'board.shotOff': 'Take the screenshot off the board',
  'board.shotOn': 'Put the screenshot back',
  'board.shotGoes': 'Deleted by itself when you mark this Done or Not doing.',
  'board.shotGone': 'The screenshot could not be loaded.',

  'board.send': 'Put it on the board',
  'board.left': '{n} of {max} left today',
  'board.noneLeft': 'That is today’s {max}. Back tomorrow.',
  'board.likeThis': 'Already on the board?',
  'board.likeThisNote': 'Vote instead of sending it again.',
  // Seconding a lookalike instead of writing it again, which closes the form.
  'board.meToo': 'Me too',
  'board.meTooDone': 'Your vote is on it. Thank you.',
  'board.voted': 'Voted',
  // Two ways a post can be refused, because the answer to one is "go again"
  // and the answer to the other is "come back tomorrow".
  'board.failed': 'That did not go through. Try again.',
  'board.failedFull': 'Not posted: that was today’s {max}. Back tomorrow.',
  'board.reviewed': 'You reviewed {app} already. Throw yours away to write a new one.',
  'board.sent': 'Feedback sent!',
  'board.sentNote': 'Thank you. It is on the board now.',
  // On a board that approves posts first: it did arrive, it is just not up yet.
  'board.sentWaiting': 'Thank you. It shows on the board once {app} approved it.',
  'board.waiting': 'Waiting for approval',
  'board.sentBack': 'Back to the board',

  // ---- Throwing your own away ----
  'board.delete': 'Throw away',
  'board.deleteTitle': 'Throw this away?',
  'board.deleteNote': 'It leaves the board for everybody, with its votes.',
  'board.cancel': 'Cancel',

  // ---- Answering one (owners only) ----
  'board.manage': 'Answer this',
  'board.setStatus': 'Where it stands',
  'board.replyLabel': 'Your answer',
  'board.replyPlaceholder': 'Say something back',
  'board.hide': 'Take off the board',
  'board.unhide': 'Put it back',
  'board.hidden': 'Off the board',
  'board.approve': 'Approve: put it on the board',
  'board.unapprove': 'Keep it waiting',
  'board.save': 'Save',
  'board.context': 'Sent with',

  // ---- Where a fix is ----
  // In the owner's sheet, once Done is picked. An idea is built, not fixed.
  'fix.title': 'Fixed in',
  'fix.titleIdea': 'Built in',
  'fix.version': 'Version',
  'fix.versionBad': 'Letters, numbers and dots only, like 1.4.2.',
  'fix.link': 'Link to the fix',
  'fix.linkNote': 'A commit, pull request or release on github.com or gitlab.com.',
  'fix.linkBad': 'That is not a link to a page on github.com or gitlab.com.',
  'fix.who': 'Whoever reported this sees it on their board.',
  // On the card, for everybody.
  'fix.in': 'Fixed in {version}',
  'fix.inIdea': 'Built in {version}',
  // {site} is GitHub or GitLab, whichever the link goes to.
  'fix.view': 'View on {site}',

  // ---- The note for whoever reported it ----
  'news.bug': 'Your bug is fixed',
  'news.bugIn': 'Your bug is fixed in {version}',
  'news.idea': 'Your idea is built',
  'news.ideaIn': 'Your idea is in {version}',
  'news.see': 'See the fix',

  // ---- The conversation under a post ----
  'talk.title': 'Conversation',
  'talk.open': 'Open the conversation',
  'talk.count': '{n} messages',
  'talk.you': 'You say',
  'talk.who': '{who} says',
  'talk.edited': 'edited',
  'talk.answerLabel': 'Your answer to {app}',
  'talk.placeholder': 'Write your answer…',
  'talk.send': 'Send',
  'talk.edit': 'Edit',
  'talk.remove': 'Remove',
  'talk.save': 'Save',
  'talk.next': '{app} answers next.',
  'talk.closedDone': 'Closed: {app} marked this done.',
  'talk.closedDeclined': 'Closed: {app} is not doing this.',
  // Said when what was on screen is no longer what is on the board.
  'talk.moved': 'Something changed in the meantime. Have a look first.',
  'talk.hide': 'Hide',
  'talk.unhide': 'Put back',
  'talk.label': 'Conversation',
  'talk.writeTo': 'Write to {who}…',
  'talk.changeLast': 'Change your last message',
  'talk.gets': '{who} gets a note on the board.',
  // How an owner's sheet names the author of an anonymous post.
  'talk.author': 'the author',

  // ---- The note for whoever wrote it, once the app answered ----
  'answered.bug': '{app} answered your bug',
  'answered.idea': '{app} answered your idea',
  'answered.review': '{app} answered your review',
  'answered.see': 'See the conversation',

  // ---- For owners: answers waiting ----
  'owner.newAnswer': 'New answer',
  'owner.waitingOne': '1 answer waits for you',
  'owner.waitingMany': '{n} answers wait for you',
  'owner.showThese': 'Show only these',

  // ---- Search and filter ----
  'search.placeholder': 'Search bugs and ideas',
  'search.clear': 'Clear the search',
  'search.countOne': '1 post matches "{q}"',
  'search.count': '{n} posts match "{q}"',
  'search.inThread': 'In the conversation:',
  'filter.button': 'Filter',
  'filter.title': 'Filter',
  'filter.kind': 'Kind',
  'filter.status': 'Status',
  'filter.statusNote': 'Reviews have no status, so choosing one hides them.',
  'filter.own': 'Only for you',
  'filter.waiting': 'Waiting on you',
  'filter.mine': 'Only my posts',
  'filter.reset': 'Reset',
  'filter.showOne': 'Show 1 post',
  'filter.show': 'Show {n} posts',
  'filter.on': '{n} filters on',
  'filter.remove': 'Turn off {label}',
  'filter.clearAll': 'Clear all',
  'filter.none': 'Nothing found',
  'filter.noneNote': 'Nothing matches your search and filters. Clear them to look everywhere.',
  'filter.clear': 'Clear search and filters',

  // ---- Updates ----
  'updates.title': 'Updates',
  'updates.intro': 'What changed in {app}. Tap one to see the change itself.',
  'updates.empty': 'No updates yet.',
  'updates.emptyOwner': 'No updates yet. Write the first one with +.',
  'updates.bugOne': '1 bug',
  'updates.bugMany': '{n} bugs',
  'updates.ideaOne': '1 idea',
  'updates.ideaMany': '{n} ideas',
  'updates.fromBoard': '{list} from this board',
  'updates.write': 'New update',
  'updates.titleLabel': 'Title',
  'updates.titlePlaceholder': 'What changed, in a few words',
  'updates.link': 'Link on GitHub or GitLab',
  'updates.linkNote': 'Only github.com and gitlab.com links: a release, pull request or commit.',
  'updates.textLabel': 'What changed',
  'updates.textPlaceholder': 'A few lines for the people using {app}',
  'updates.fixes': 'What it fixes',
  'updates.fixesNote': 'Open and planned bugs and ideas. Ticked ones go to Done, with this version and link.',
  'updates.fixesNone': 'No open bugs or ideas on the board.',
  'updates.publish': 'Publish update',
  'updates.delete': 'Delete update',
  'updates.deleteTitle': 'Delete this update?',
  'updates.deleteNote': 'It leaves the Updates page. The posts it fixed stay Done.',
  'updates.deleteBtn': 'Delete',

  // ---- When ----
  'time.now': 'just now',
  'time.min': '{n}m ago',
  'time.hour': '{n}h ago',
  'time.day': '{n}d ago',
} satisfies Record<string, string>;

export type CopyKey = keyof typeof COPY;
export type Strings = Partial<Record<CopyKey, string>>;
export type Translate = (key: CopyKey, vars?: Record<string, string | number>) => string;

/**
 * A `t()` with the developer's overrides on top of the English.
 *
 * Overrides win, then English, so a developer translating into French may
 * translate half the keys and still never show a hole.
 *
 * @example
 * const t = translator({ 'board.title': 'Ideeënbus', 'board.reply': '{app} zegt' });
 * t('board.title')                    // → 'Ideeënbus'
 * t('board.reply', { app: 'My app' }) // → 'My app zegt'
 */
export function translator(strings: Strings = {}): Translate {
  return (key, vars) => {
    let text: string = strings[key] ?? COPY[key];
    if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
    return text;
  };
}
