(function () {
  'use strict';

  // Предохранитель: что бы ни случилось, блок не должен остаться скрытым навсегда.
  var safetyTimer = setTimeout(function () {
    if (window.__moveReveal) window.__moveReveal();
  }, 6000);

  function done() {
    clearTimeout(safetyTimer);
    if (window.__moveReveal) window.__moveReveal();
  }

  if (typeof window.gsap === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
    done();
    return;
  }

  try {
    var gsap = window.gsap;
    var section = document.querySelector('.move_section');
    if (!section) { done(); return; }

    var heading = section.querySelectorAll('[data-move-el="heading"]');
    var icons = section.querySelectorAll('[data-move-el="icon"]');

    // phone_img_wrapper всегда стоит в дефолтной позиции — не трогаем его вообще.
    // Остальные 4 картинки летят из "разбросанных" точек и собираются в свои же
    // штатные CSS-позиции (заданные inset/transform в css/fff-9072af.webflow.css).
    // finalRotate — угол поворота из CSS для каждого элемента: GSAP пишет transform
    // инлайново и полностью перекрывает правило из стилшита, поэтому в конце твина
    // нужно вручную вернуть тот же угол, что задан в дизайне.
    var scatterConfig = [
      { selector: '[data-move-el="scatter-1"]', finalRotate: 11, fromX: 420, fromY: -260, spin: -70 },
      { selector: '[data-move-el="scatter-2"]', finalRotate: -5.845, fromX: -430, fromY: 240, spin: 80 },
      { selector: '[data-move-el="scatter-3"]', finalRotate: -8.302, fromX: 320, fromY: 220, spin: -90 },
      { selector: '[data-move-el="scatter-4"]', finalRotate: 0, fromX: -340, fromY: -210, spin: 100 }
    ];

    var scatterEls = scatterConfig
      .map(function (cfg) {
        var el = section.querySelector(cfg.selector);
        return el ? { el: el, cfg: cfg } : null;
      })
      .filter(Boolean);

    gsap.set(heading, { opacity: 0, y: 26 });
    gsap.set(icons, { opacity: 0, scale: 0.5, rotate: -25 });
    scatterEls.forEach(function (item) {
      gsap.set(item.el, {
        opacity: 0,
        x: item.cfg.fromX,
        y: item.cfg.fromY,
        rotate: item.cfg.finalRotate + item.cfg.spin,
        scale: 0.55
      });
    });

    function play() {
      var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: done });

      tl.to(heading, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 });
      tl.to(icons, {
        opacity: 1, scale: 1, rotate: 0, duration: 0.8, stagger: 0.1, ease: 'back.out(2.4)'
      }, '-=0.45');

      scatterEls.forEach(function (item, i) {
        tl.to(item.el, {
          opacity: 1,
          x: 0,
          y: 0,
          rotate: item.cfg.finalRotate,
          scale: 1,
          duration: 1,
          ease: 'back.out(1.6)'
        }, i === 0 ? '-=0.3' : '-=0.75');
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
