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
    if (!heading.length) { done(); return; }

    gsap.set(heading, { opacity: 0, y: 26 });

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        gsap.to(heading, {
          opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out', onComplete: done
        });
      });
    }, { threshold: 0 });
    observer.observe(section);
  } catch (err) {
    done();
  }
})();
