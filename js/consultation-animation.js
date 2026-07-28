(function () {
  'use strict';

  var safetyTimer = setTimeout(function () {
    if (window.__consultationReveal) window.__consultationReveal();
  }, 6000);

  function done() {
    clearTimeout(safetyTimer);
    if (window.__consultationReveal) window.__consultationReveal();
  }

  if (typeof window.gsap === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
    done();
    return;
  }

  try {
    var gsap = window.gsap;
    var section = document.querySelector('.consultation_section');
    if (!section) { done(); return; }

    var heading = section.querySelectorAll('[data-consultation-el="heading"]');

    // У декоративных иконок в CSS свой угол наклона — анимируем к нему, а не к 0,
    // иначе GSAP инлайн-стилем перезапишет дизайнерский наклон.
    var iconConfigs = [
      { el: section.querySelector('.cheli_img_wrapper'), finalRotate: 12.38 },
      { el: section.querySelector('.hand_img_wrapper'), finalRotate: -24.91 },
      { el: section.querySelector('.mouth_img_wrapper'), finalRotate: 18.41 }
    ].filter(function (c) { return c.el; });

    if (!heading.length && !iconConfigs.length) { done(); return; }

    gsap.set(heading, { opacity: 0, y: 26 });
    iconConfigs.forEach(function (c) {
      gsap.set(c.el, { opacity: 0, scale: 0.5, rotate: c.finalRotate - 25 });
    });

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: done });
        tl.to(heading, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 });
        iconConfigs.forEach(function (c, i) {
          tl.to(c.el, {
            opacity: 1, scale: 1, rotate: c.finalRotate, duration: 0.8, ease: 'back.out(2.4)'
          }, i === 0 ? '-=0.45' : '<0.1');
        });
      });
    }, { threshold: 0 });
    observer.observe(section);
  } catch (err) {
    done();
  }
})();
