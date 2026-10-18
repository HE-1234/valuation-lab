/* Annual Report visual layer. Presentation only: no model, data, route or draft
   state. Runs synchronously in <head> so the design paints on first frame. */
(function () {
  var root = document.documentElement;
  var base = (document.currentScript && document.currentScript.src || '').replace(/skin-loader\.js(\?.*)?$/, '') || 'skins/';

  root.dataset.skin = 'report';
  // The page-load moment starts hidden; skin-motion.js releases it once the
  // workspace has rendered. The timeout guarantees content is never withheld.
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!still) {
    root.setAttribute('data-sk-intro', '');
    setTimeout(function () { root.removeAttribute('data-sk-intro'); }, 2600);
  }
  // Parser-inserted links stay render-blocking in every engine, so there is no
  // unstyled flash. They come after every application stylesheet in cascade order.
  [base + 'skin-base.css', base + 'report.css'].forEach(function (href) {
    document.write('<link rel="stylesheet" data-skin-sheet href="' + href + '">');
  });
  // Clear the choice the review switcher used to remember.
  try { localStorage.removeItem('valuation-lab-skin'); } catch (e) {}
})();
