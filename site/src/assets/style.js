/*
 * The site's two looks: PleaseNoBugs' own (dark purple, the default) and the
 * Nimiq Foundation's (navy and gold on white, assets/nimiq.css). A button in
 * the header flips between them, like a dark/light switch, and this browser
 * remembers the choice. Nothing leaves the browser.
 *
 * Loaded in <head>, before the page is drawn, so a visitor who chose Nimiq
 * never sees the purple first. A classic script, not a module: modules wait.
 *
 * The widgets on the page follow: `pleasenobugs` in the one look, `nimiq` in
 * the other. Scripts that make widgets ask `PNBStyle.theme()`, and hear
 * `pnb:style` when it changes.
 *
 * Parked for the first version: everyone sees the classic look, the header
 * button stays hidden, and a Nimiq choice made earlier is not read. The
 * Nimiq look itself stays in the repo; set PARKED to false to bring it back.
 */
(function () {
  var PARKED = true;
  var KEY = 'pnb-style';
  var root = document.documentElement;

  function read() {
    if (PARKED) return 'classic';
    try {
      return localStorage.getItem(KEY) === 'nimiq' ? 'nimiq' : 'classic';
    } catch (e) {
      return 'classic';
    }
  }

  function theme(style) {
    return (style || current) === 'nimiq' ? 'nimiq' : 'pleasenobugs';
  }

  var current = read();
  if (current === 'nimiq') root.setAttribute('data-style', 'nimiq');

  /** What the button says: the look it switches to. */
  function label(btn) {
    var to = current === 'nimiq' ? 'Classic style' : 'Nimiq style';
    var text = btn.querySelector('.style-switch__text');
    if (text) text.textContent = to;
    btn.setAttribute('aria-label', current === 'nimiq' ? 'Switch to the classic style' : 'Switch to the Nimiq style');
  }

  function set(style) {
    current = style === 'nimiq' ? 'nimiq' : 'classic';
    if (current === 'nimiq') root.setAttribute('data-style', 'nimiq');
    else root.removeAttribute('data-style');
    try {
      localStorage.setItem(KEY, current);
    } catch (e) {
      /* A private window: the choice lasts as long as the page. */
    }
    // The widgets that wear the site's look; a widget in another theme on
    // purpose (a demo of `light`, say) keeps it.
    var widgets = document.querySelectorAll('please-no-bugs');
    for (var i = 0; i < widgets.length; i++) {
      var t = widgets[i].getAttribute('theme');
      if (t === 'pleasenobugs' || t === 'nimiq') widgets[i].setAttribute('theme', theme());
    }
    var buttons = document.querySelectorAll('[data-style-switch]');
    for (var j = 0; j < buttons.length; j++) label(buttons[j]);
    document.dispatchEvent(new CustomEvent('pnb:style', { detail: { style: current, theme: theme() } }));
  }

  window.PNBStyle = {
    get: function () {
      return current;
    },
    theme: function () {
      return theme();
    },
    set: set,
  };

  function wire() {
    if (PARKED) return;
    var buttons = document.querySelectorAll('[data-style-switch]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      label(btn);
      btn.hidden = false;
      btn.addEventListener('click', function () {
        set(current === 'nimiq' ? 'classic' : 'nimiq');
      });
    }
    // Widgets written into the page itself, before any script ran.
    if (current === 'nimiq') set('nimiq');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
