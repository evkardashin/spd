(function () {
  'use strict';

  // Предохранитель: что бы ни случилось, блок не должен остаться скрытым навсегда.
  var safetyTimer = setTimeout(function () {
    if (window.__skillReveal) window.__skillReveal();
  }, 6000);

  function done() {
    clearTimeout(safetyTimer);
    if (window.__skillReveal) window.__skillReveal();
  }

  if (typeof window.gsap === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
    done();
    return;
  }

  try {
    var gsap = window.gsap;
    var section = document.querySelector('.skill_section');
    if (!section) { done(); return; }

    var heading = section.querySelectorAll('[data-skill-el="heading"]');
    var cta = section.querySelector('[data-skill-el="cta"]');

    // skill_bg_wrapper и skill_design_wrapper всегда стоят в дефолтной позиции — не
    // трогаем их вообще (по просьбе — "прилетают только карточки"). Остальные 4
    // карточки летят из "разбросанных" точек и собираются в свои же штатные
    // CSS-позиции (заданные inset/transform в css/fff-9072af.webflow.css) — та же
    // техника, что и в js/move-animation.js.
    var scatterConfig = [
      { selector: '[data-skill-el="scatter-1"]', finalRotate: 12.137, fromX: -400, fromY: 240, spin: 80 },
      { selector: '[data-skill-el="scatter-2"]', finalRotate: -5.845, fromX: -380, fromY: -230, spin: -90 },
      { selector: '[data-skill-el="scatter-3"]', finalRotate: 11.013, fromX: 410, fromY: -220, spin: -75 },
      { selector: '[data-skill-el="scatter-4"]', finalRotate: -5.03, fromX: 390, fromY: 250, spin: 90 }
    ];

    var scatterEls = scatterConfig
      .map(function (cfg) {
        var el = section.querySelector(cfg.selector);
        return el ? { el: el, cfg: cfg } : null;
      })
      .filter(Boolean);

    gsap.set(heading, { opacity: 0, y: 26 });
    if (cta) gsap.set(cta, { opacity: 0, y: 22, scale: 0.88, rotate: -4 });
    scatterEls.forEach(function (item) {
      gsap.set(item.el, {
        opacity: 0,
        x: item.cfg.fromX,
        y: item.cfg.fromY,
        rotate: item.cfg.finalRotate + item.cfg.spin,
        scale: 0.55
      });
    });

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.disconnect();

        var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: done });

        tl.to(heading, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 });
        if (cta) {
          tl.to(cta, { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2.2)' }, '-=0.3');
        }

        scatterEls.forEach(function (item, i) {
          tl.to(item.el, {
            opacity: 1,
            x: 0,
            y: 0,
            rotate: item.cfg.finalRotate,
            scale: 1,
            duration: 0.65,
            ease: 'back.out(1.6)'
          }, i === 0 ? '-=0.13' : '-=0.48');
        });
      });
      // rootMargin даёт анимации фору в 350px до реального попадания секции в
      // вьюпорт — иначе при быстрой прокрутке видно белый экран, пока триггер
      // ещё не сработал.
    }, { threshold: 0, rootMargin: '0px 0px 350px 0px' });

    observer.observe(section);
  } catch (err) {
    done();
  }
})();
