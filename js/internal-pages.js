(function () {
  'use strict';

  var bar = document.querySelector('.scroll_progress_bar');
  var frame = false;
  function updateProgress() {
    frame = false;
    if (!bar) return;
    var root = document.documentElement;
    var max = root.scrollHeight - root.clientHeight;
    var value = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, value)) + ')';
  }
  function requestProgress() {
    if (frame) return;
    frame = true;
    requestAnimationFrame(updateProgress);
  }
  addEventListener('scroll', requestProgress, { passive: true });
  addEventListener('resize', requestProgress);
  addEventListener('load', requestProgress);
  if ('ResizeObserver' in window) new ResizeObserver(requestProgress).observe(document.body);
  requestProgress();

  var menuButton = document.querySelector('.menu-button');
  var mobileMenu = document.querySelector('.mobile-menu');
  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.textContent = open ? 'закрыть' : 'менюшка';
    });
    mobileMenu.addEventListener('click', function (event) {
      if (!event.target.closest('a')) return;
      mobileMenu.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.textContent = 'менюшка';
    });
  }

  var revealItems = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  }

  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc-link'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-15% 0px -70% 0px' });
    tocLinks.forEach(function (link) {
      var section = document.querySelector(link.getAttribute('href'));
      if (section) sectionObserver.observe(section);
    });
  }
})();
