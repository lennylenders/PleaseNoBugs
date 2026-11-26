/*
 * Light or dark, for the whole site. Loaded in <head>, before the page is
 * drawn, so a visitor in dark mode never sees it light first. A classic
 * script, not a module: modules wait.
 *
 * It starts as the device is set (prefers-color-scheme) and follows it while
 * the visitor has not chosen; the button in the header (`[data-mode-switch]`)
 * flips it, and this browser remembers that choice. Nothing leaves the
 * browser.
 *
 * The widgets on the page follow: `light` or `dark`. Those this script does
 * not own (`[data-own-theme]`, the preview on Get your widget) hear
 * `pnb:mode` and decide themselves; scripts that make widgets later ask
 * `PNBMode.theme()`.
 */
(function () {
  var KEY = 'pnb-mode';
  var root = document.documentElement;
  var device = window.matchMedia('(prefers-color-scheme: dark)');

  function saved() {
    try {
      var v = localStorage.getItem(KEY);
      return v === 'dark' || v === 'light' ? v : null;
    } catch (e) {
      return null;
    }
  }

  var current = saved() || (device.matches ? 'dark' : 'light');

  function paint() {
    if (current === 'dark') root.setAttribute('data-mode', 'dark');
    else root.removeAttribute('data-mode');
    var widgets = document.querySelectorAll('please-no-bugs:not([data-own-theme])');
    for (var i = 0; i < widgets.length; i++) widgets[i].setAttribute('theme', current);
    var buttons = document.querySelectorAll('[data-mode-switch]');
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].setAttribute('aria-pressed', String(current === 'dark'));
      buttons[j].setAttribute('aria-label', current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      buttons[j].title = buttons[j].getAttribute('aria-label');
    }
  }

  function set(mode, remember) {
    current = mode === 'dark' ? 'dark' : 'light';
    if (remember) {
      try {
        localStorage.setItem(KEY, current);
      } catch (e) {
        /* A private window: the choice lasts as long as the page. */
      }
    }
    paint();
    document.dispatchEvent(new CustomEvent('pnb:mode', { detail: current }));
  }

  // The device changes (the evening comes): followed, unless the visitor chose.
  device.addEventListener('change', function (e) {
    if (!saved()) set(e.matches ? 'dark' : 'light', false);
  });

  window.PNBMode = {
    get: function () {
      return current;
    },
    theme: function () {
      return current;
    },
    set: function (mode) {
      set(mode, true);
    },
  };

  paint();
  document.addEventListener('DOMContentLoaded', function () {
    paint();
    // The bar at the top gets a thin line under it once the page is scrolled.
    var bar = document.querySelector('.top');
    if (bar) {
      var scrolled = function () {
        bar.classList.toggle('top--scrolled', window.scrollY > 4);
      };
      scrolled();
      window.addEventListener('scroll', scrolled, { passive: true });
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-mode-switch]');
      if (b) set(current === 'dark' ? 'light' : 'dark', true);
    });
  });
})();
