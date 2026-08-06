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
    var cards = Array.prototype.slice.call(section.querySelectorAll('[data-consultation-el="card"]'));
    var cardsWrapper = section.querySelector('.consultation_carts_wrapper');
    var subheading = section.querySelector('[data-consultation-el="subheading"]');
    var isMobile = window.matchMedia('(max-width: 479px)').matches;

    // У декоративных иконок в CSS свой угол наклона — анимируем к нему, а не к 0,
    // иначе GSAP инлайн-стилем перезапишет дизайнерский наклон.
    var iconConfigs = [
      { el: section.querySelector('.cheli_img_wrapper'), finalRotate: 12.38 },
      { el: section.querySelector('.hand_img_wrapper'), finalRotate: -24.91 },
      { el: section.querySelector('.mouth_img_wrapper'), finalRotate: 18.41 }
    ].filter(function (c) { return c.el; });

    if (!heading.length && !iconConfigs.length && !cards.length) { done(); return; }

    gsap.set(heading, { opacity: 0, y: 26 });
    iconConfigs.forEach(function (c) {
      gsap.set(c.el, { opacity: 0, scale: 0.5, rotate: c.finalRotate - 25 });
    });
    if (subheading) gsap.set(subheading, { opacity: 0, y: 24, scale: 0.96 });

    if (isMobile) {
      // На мобилке transform карточек уже управляется coverflow-свайпером.
      // Анимируем весь готовый deck, не перезаписывая его геометрию.
      if (cardsWrapper) gsap.set(cardsWrapper, { opacity: 0, y: 36, scale: 0.96 });
    } else {
      // На десктопе пять карточек раскладываются веером из центра.
      var spreadX = [-88, -42, 0, 42, 88];
      var spreadY = [38, 18, 0, 18, 38];
      var spreadRotate = [-6, -3, 0, 3, 6];
      cards.forEach(function (card, index) {
        gsap.set(card, {
          opacity: 0,
          x: spreadX[index] || 0,
          y: spreadY[index] || 0,
          scale: index === 2 ? 0.94 : 0.9,
          rotate: spreadRotate[index] || 0
        });
      });
    }

    // Все стартовые состояния уже стоят инлайново — общий CSS-антифликер можно
    // снять сейчас, чтобы карточки управлялись независимо от safety-таймера.
    if (window.__consultationReveal) window.__consultationReveal();

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

        if (isMobile) {
          if (cardsWrapper) {
            tl.to(cardsWrapper, {
              opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.45)'
            }, '-=0.25');
          }
        } else if (cards.length) {
          tl.to(cards, {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            rotate: 0,
            duration: 0.9,
            stagger: { each: 0.09, from: 'center' },
            ease: 'back.out(1.55)'
          }, '-=0.3');
        }

        if (subheading) {
          tl.to(subheading, {
            opacity: 1, y: 0, scale: 1, duration: 0.65, ease: 'power3.out'
          }, '-=0.35');
        }
      });
    }, { threshold: 0 });
    observer.observe(section);
  } catch (err) {
    done();
  }
})();
