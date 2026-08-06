(function () {
  'use strict';

  var bar = document.querySelector('.scroll_progress_bar');
  if (!bar) return;

  var frameRequested = false;

  function updateProgress() {
    frameRequested = false;

    var root = document.documentElement;
    var scrollableHeight = root.scrollHeight - root.clientHeight;
    var progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;

    progress = Math.max(0, Math.min(1, progress));
    bar.style.transform = 'scaleX(' + progress + ')';
  }

  function requestUpdate() {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updateProgress);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  window.addEventListener('load', requestUpdate);

  if (typeof window.ResizeObserver !== 'undefined') {
    new ResizeObserver(requestUpdate).observe(document.body);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(requestUpdate);
  }

  requestUpdate();
})();
