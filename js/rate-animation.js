(function () {
  'use strict';

  var safetyTimer = setTimeout(function () {
    if (window.__rateReveal) window.__rateReveal();
  }, 6000);

  function done() {
    clearTimeout(safetyTimer);
    if (window.__rateReveal) window.__rateReveal();
  }

  if (typeof window.gsap === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
    done();
    return;
  }

  try {
    var gsap = window.gsap;
    var section = document.querySelector('.rate_section');
    if (!section) { done(); return; }

    // Заголовок продублирован для десктопа (3 строки) и мобильного (1 общая строка,
    // переключаются через display в CSS) — анимируем все варианты разом, скрытый
    // вариант просто не даёт визуального эффекта.
    var heading = section.querySelectorAll('[data-rate-el="heading"]');
    var cards = Array.prototype.slice.call(section.querySelectorAll('[data-rate-el="card"]'));
    if (!heading.length && !cards.length) { done(); return; }

    gsap.set(heading, { opacity: 0, y: 26 });
    cards.forEach(function (card, index) {
      // Волна: нечётные карточки стартуют ниже, крайние чуть развёрнуты наружу.
      var centerDistance = index - (cards.length - 1) / 2;
      gsap.set(card, {
        opacity: 0,
        y: index % 2 === 0 ? 32 : 58,
        scale: 0.9,
        rotate: centerDistance * 1.8
      });
    });

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: done });
        if (heading.length) {
          tl.to(heading, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 });
        }
        if (cards.length) {
          tl.to(cards, {
            opacity: 1,
            y: 0,
            scale: 1,
            rotate: 0,
            duration: 0.85,
            stagger: 0.1,
            ease: 'sine.out'
          }, heading.length ? '-=0.3' : 0);
        }
      });
    }, { threshold: 0 });
    observer.observe(section);
  } catch (err) {
    done();
  }
})();
