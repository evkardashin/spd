(function () {
  'use strict';

  // Предохранитель: что бы ни случилось, блок не должен остаться скрытым навсегда.
  var safetyTimer = setTimeout(function () {
    if (window.__crisisReveal) window.__crisisReveal();
  }, 6000);

  function done() {
    clearTimeout(safetyTimer);
    if (window.__crisisReveal) window.__crisisReveal();
  }

  if (typeof window.gsap === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
    done();
    return;
  }

  try {
    var gsap = window.gsap;
    var section = document.querySelector('.crisis_section');
    if (!section) { done(); return; }

    var heading = section.querySelectorAll('[data-crisis-el="heading"]');

    // У heart_img_wrapper и man_img_wrapper в CSS свой угол наклона — если
    // анимировать их разом к rotate:0, GSAP перезапишет инлайн-стилем и наклон
    // навсегда потеряется. Значения взяты из css/fff-9072af.webflow.css.
    var iconConfigs = [
      { el: section.querySelector('.heart_img_wrapper'), finalRotate: 9.65 },
      { el: section.querySelector('.man_img_wrapper'), finalRotate: -17.747 }
    ].filter(function (c) { return c.el; });

    function play() {
      var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: done });

      gsap.set(heading, { opacity: 0, y: 26 });
      iconConfigs.forEach(function (c) {
        gsap.set(c.el, { opacity: 0, scale: 0.5, rotate: c.finalRotate - 25 });
      });

      tl.to(heading, { opacity: 1, y: 0, duration: 0.7 });
      iconConfigs.forEach(function (c, i) {
        tl.to(c.el, {
          opacity: 1, scale: 1, rotate: c.finalRotate, duration: 0.8, ease: 'back.out(2.4)'
        }, i === 0 ? '-=0.45' : '<0.1');
      });
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        play();
      });
    }, { threshold: 0 });

    observer.observe(section);
  } catch (err) {
    done();
  }
})();
