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
    var visual = section.querySelector('[data-plan-el="visual"]');
    var cards = Array.prototype.slice.call(section.querySelectorAll('[data-plan-el="card"]'));

    // У карточек свои углы наклона, причём мобильная композиция использует
    // отдельные значения. Возвращаем каждую к её брейкпоинтному углу, иначе
    // GSAP перезапишет CSS-повороты единым десктопным вариантом.
    var isMobile = window.matchMedia('(max-width: 479px)').matches;
    var cardConfigs = [
      { el: cards[0], finalRotate: isMobile ? -9 : 9, fromX: -90, fromY: 24 },
      { el: cards[1], finalRotate: isMobile ? 9 : -9, fromX: 0, fromY: 54 },
      { el: cards[2], finalRotate: isMobile ? 2 : -9, fromX: 90, fromY: 24 }
    ].filter(function (c) { return c.el; });

    gsap.set(heading, { opacity: 0, y: 26 });
    if (cta) gsap.set(cta, { opacity: 0, y: 22, scale: 0.88, rotate: -4 });
    if (visual) gsap.set(visual, { opacity: 0, scale: 0.82, rotate: -2 });
    cardConfigs.forEach(function (c) {
      gsap.set(c.el, {
        opacity: 0, x: c.fromX, y: c.fromY, scale: 0.88, rotate: c.finalRotate - 20
      });
    });

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.disconnect();

        var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: done });

        tl.to(heading, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 });
        if (visual) {
          tl.to(visual, {
            opacity: 1, scale: 1, rotate: 0, duration: 0.65, ease: 'back.out(1.45)'
          }, '-=0.22');
        }
        if (cta) {
          tl.to(cta, { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2.2)' }, '-=0.42');
        }
        cardConfigs.forEach(function (c, i) {
          tl.to(c.el, {
            opacity: 1, x: 0, y: 0, scale: 1, rotate: c.finalRotate,
            duration: 0.6, ease: 'back.out(1.65)'
          }, i === 0 ? '-=0.26' : '<0.08');
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
