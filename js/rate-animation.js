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

    // У каждой карточки в CSS свой угол наклона ("стопка фотографий") — см.
    // .rate_cart_wrapper._1.._5 в css/fff-9072af.webflow.css. Анимируем к нему,
    // а не к 0, иначе GSAP инлайн-стилем перезапишет наклон и карточки на
    // финале окажутся плоскими.
    var cardFinalRotate = [-1.19, 3.014, -3.366, 0.943, -1.164];

    gsap.set(heading, { opacity: 0, y: 26 });
    cards.forEach(function (card, index) {
      // Волна: нечётные карточки стартуют ниже, крайние чуть развёрнуты наружу
      // (доп. разворот поверх собственного финального угла карточки).
      var centerDistance = index - (cards.length - 1) / 2;
      gsap.set(card, {
        opacity: 0,
        y: index % 2 === 0 ? 32 : 58,
        scale: 0.9,
        rotate: (cardFinalRotate[index] || 0) + centerDistance * 1.8
      });
    });

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: done });
        if (heading.length) {
          tl.to(heading, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 });
        }
        if (cards.length) {
          tl.to(cards, {
            opacity: 1,
            y: 0,
            scale: 1,
            rotate: function (i) { return cardFinalRotate[i] || 0; },
            duration: 0.55,
            stagger: 0.06,
            ease: 'sine.out'
          }, heading.length ? '-=0.2' : 0);
        }
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
