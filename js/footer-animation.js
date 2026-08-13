(function () {
  'use strict';

  var safetyTimer = setTimeout(function () {
    if (window.__footerReveal) window.__footerReveal();
  }, 6000);

  function done() {
    clearTimeout(safetyTimer);
    if (window.__footerReveal) window.__footerReveal();
  }

  if (typeof window.gsap === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
    done();
    return;
  }

  try {
    var gsap = window.gsap;
    var sections = Array.prototype.slice.call(document.querySelectorAll('.footer, .footer_mob'));
    if (!sections.length) { done(); return; }

    var observers = [];

    sections.forEach(function (section) {
      var top = section.querySelector('[data-footer-el="top"]');
      var title = section.querySelector('[data-footer-el="title"]');
      var cta = section.querySelector('[data-footer-el="cta"]');
      var bottom = section.querySelector('[data-footer-el="bottom"]');
      var compact = section.classList.contains('footer_mob');

      var decorConfigs = [
        { el: section.querySelector('.nemo_img_wrapper'), rotate: -13.119, x: 0, y: compact ? -32 : -54 },
        { el: section.querySelector('.ezh_img_wrapper'), rotate: 17.699, x: compact ? 42 : 82, y: 24 },
        { el: section.querySelector('.chaynik_img_wrapper'), rotate: 0, x: 0, y: compact ? 34 : 52 },
        { el: section.querySelector('.rabbit_img_wrapper'), rotate: -6.657, x: compact ? -38 : -68, y: 12 },
        { el: section.querySelector('.stop_img_wrapper'), rotate: 18.926, x: compact ? 30 : 46, y: compact ? 34 : 52 }
      ].filter(function (config) { return config.el; });

      if (top) gsap.set(top, { opacity: 0, y: compact ? 18 : 26 });
      if (title) {
        gsap.set(title, {
          opacity: 0,
          y: compact ? 28 : 40,
          scaleX: compact ? 0.9 : 0.82,
          scaleY: compact ? 0.94 : 1.08,
          transformOrigin: '50% 50%'
        });
      }
      if (cta) gsap.set(cta, { opacity: 0, y: 28, scale: 0.84, rotate: -3 });
      if (bottom) gsap.set(bottom, { opacity: 0, y: 22 });

      decorConfigs.forEach(function (config, index) {
        gsap.set(config.el, {
          opacity: 0,
          x: config.x,
          y: config.y,
          scale: compact ? 0.66 : 0.56,
          rotate: config.rotate + (index % 2 === 0 ? -12 : 12)
        });
      });

      var observer = new IntersectionObserver(function (entries, currentObserver) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          currentObserver.disconnect();

          var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: done });
          if (top) tl.to(top, { opacity: 1, y: 0, duration: 0.48 });
          if (title) {
            tl.to(title, {
              opacity: 1, y: 0, scaleX: 1, scaleY: 1,
              duration: 0.58, ease: 'back.out(1.55)'
            }, '-=0.18');
          }

          decorConfigs.forEach(function (config, index) {
            tl.to(config.el, {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              rotate: config.rotate,
              duration: compact ? 0.48 : 0.58,
              ease: 'back.out(1.8)'
            }, index === 0 ? '-=0.32' : '<0.06');
          });

          if (cta && getComputedStyle(cta).display !== 'none') {
            tl.to(cta, {
              opacity: 1, y: 0, scale: 1, rotate: 0,
              duration: 0.5, ease: 'back.out(2)'
            }, '-=0.3');
          }
          if (bottom) tl.to(bottom, { opacity: 1, y: 0, duration: 0.42 }, '-=0.22');
        });
      }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

      observer.observe(section);
      observers.push(observer);
    });

    // Стартовые состояния уже выставлены инлайново для обеих версий футера.
    // Снимаем общий анти-фликер: дальше видимость контролируют observers.
    if (window.__footerReveal) window.__footerReveal();
  } catch (err) {
    done();
  }
})();
