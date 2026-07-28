(function () {
  'use strict';

  // Предохранитель: что бы ни случилось, блок не должен остаться скрытым навсегда.
  var safetyTimer = setTimeout(function () {
    if (window.__planReveal) window.__planReveal();
  }, 6000);

  function done() {
    clearTimeout(safetyTimer);
    if (window.__planReveal) window.__planReveal();
  }

  if (typeof window.gsap === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
    done();
    return;
  }

  try {
    var gsap = window.gsap;
    var section = document.querySelector('.plan_section');
    if (!section) { done(); return; }

    var heading = section.querySelectorAll('[data-plan-el="heading"]');
    var cta = section.querySelector('[data-plan-el="cta"]');
    var cards = Array.prototype.slice.call(section.querySelectorAll('[data-plan-el="card"]'));

    // У карточек в CSS свой угол наклона (.rotate-9: _1 = 9deg, _2/_3 = -9deg) —
    // если анимировать все разом к rotate:0, GSAP перезапишет инлайн-стилем и
    // наклон навсегда потеряется. Значения взяты из css/fff-9072af.webflow.css.
    var cardConfigs = [
      { el: cards[0], finalRotate: 9 },
      { el: cards[1], finalRotate: -9 },
      { el: cards[2], finalRotate: -9 }
    ].filter(function (c) { return c.el; });

    gsap.set(heading, { opacity: 0, y: 26 });
    if (cta) gsap.set(cta, { opacity: 0, y: 22, scale: 0.88, rotate: -4 });
    cardConfigs.forEach(function (c) {
      gsap.set(c.el, { opacity: 0, y: 34, scale: 0.9, rotate: c.finalRotate - 20 });
    });

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.disconnect();

        var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: done });

        tl.to(heading, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 });
        if (cta) {
          tl.to(cta, { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 0.75, ease: 'back.out(2.2)' }, '-=0.45');
        }
        cardConfigs.forEach(function (c, i) {
          tl.to(c.el, {
            opacity: 1, y: 0, scale: 1, rotate: c.finalRotate, duration: 0.85, ease: 'back.out(1.8)'
          }, i === 0 ? '-=0.3' : '<0.1');
        });
      });
    }, { threshold: 0 });

    observer.observe(section);
  } catch (err) {
    done();
  }
})();
