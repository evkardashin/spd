(function () {
  'use strict';

  // Предохранитель: что бы ни случилось, блок не должен остаться скрытым навсегда.
  var safetyTimer = setTimeout(function () {
    if (window.__caseReveal) window.__caseReveal();
  }, 6000);

  function done() {
    clearTimeout(safetyTimer);
    if (window.__caseReveal) window.__caseReveal();
  }

  if (typeof window.gsap === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
    done();
    return;
  }

  try {
    var gsap = window.gsap;
    var section = document.querySelector('.case_section');
    if (!section) { done(); return; }

    var heading = section.querySelectorAll('[data-case-el="heading"]');
    var cards = Array.prototype.slice.call(section.querySelectorAll('[data-case-el="card"]'));
    var cta = section.querySelector('[data-case-el="cta"]');

    // У декоративных иконок в CSS свой угол наклона — если анимировать все разом
    // к rotate:0, GSAP перезапишет инлайн-стилем и наклон навсегда потеряется.
    // Значения взяты из css/fff-9072af.webflow.css.
    var iconConfigs = [
      { el: section.querySelector('.scream_img_wrapper'), finalRotate: -11.527 },
      { el: section.querySelector('.brush_img_wrapper'), finalRotate: 28.411 },
      { el: section.querySelector('.heart_img_wrapper-2'), finalRotate: 15.919 }
    ].filter(function (c) { return c.el; });

    // Карточки лежат в CSS-гриде 2 колонки × 3 ряда (.case_grid наследует
    // grid-template-columns: 1fr 1fr от .w-layout-grid), поэтому каждые 2 подряд
    // идущих элемента — визуальный ряд. Появляются по рядам: сначала первый, потом
    // второй и т.д.
    var ROW_SIZE = 2;
    var rows = [];
    for (var i = 0; i < cards.length; i += ROW_SIZE) {
      rows.push(cards.slice(i, i + ROW_SIZE));
    }

    gsap.set(heading, { opacity: 0, y: 26 });
    iconConfigs.forEach(function (c) {
      gsap.set(c.el, { opacity: 0, scale: 0.5, rotate: c.finalRotate - 25 });
    });
    cards.forEach(function (card, index) {
      var isLeft = index % ROW_SIZE === 0;
      gsap.set(card, {
        opacity: 0,
        x: isLeft ? -76 : 76,
        y: 20,
        scale: 0.92,
        rotate: isLeft ? -5 : 5
      });
    });
    if (cta) gsap.set(cta, { opacity: 0, y: 22, scale: 0.88, rotate: -4 });

    // У каждой карточки два варианта фонового фото — десктопное и мобильное.
    var cardPhotos = cards.map(function (card) {
      return card.querySelectorAll('.case_img_wrapper > img, .case_img_wrapper-mob > img');
    });
    cardPhotos.forEach(function (imgs) {
      gsap.set(imgs, { borderRadius: '30%' });
    });

    function play() {
      var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: done });

      tl.to(heading, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 });
      iconConfigs.forEach(function (c, i) {
        tl.to(c.el, {
          opacity: 1, scale: 1, rotate: c.finalRotate, duration: 0.55, ease: 'back.out(2.4)'
        }, i === 0 ? '-=0.3' : '<0.06');
      });

      rows.forEach(function (row, i) {
        var position = i === 0 ? '-=0.16' : '-=0.45';
        tl.to(row, {
          opacity: 1, x: 0, y: 0, scale: 1, rotate: 0,
          duration: 0.6, stagger: { each: 0.06, from: 'edges' }, ease: 'back.out(1.6)'
        }, position);

        var rowStart = i * ROW_SIZE;
        var photos = [];
        for (var j = rowStart; j < rowStart + ROW_SIZE && j < cardPhotos.length; j++) {
          photos.push(cardPhotos[j]);
        }
        photos.forEach(function (imgs) {
          // Плавный ease без баунса: у back.out есть перелёт значения — на пике он
          // утянул бы border-radius ниже 0 (браузер обрежет до квадрата) и вернул
          // обратно, что выглядело бы как случайный "мигающий" угол.
          tl.to(imgs, { borderRadius: '0px', duration: 0.55, ease: 'power2.out' }, '<');
        });
      });

      if (cta) {
        tl.to(cta, { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2.2)' }, '-=0.22');
      }
    }

    // rootMargin даёт анимации фору в 350px до реального попадания секции в
    // вьюпорт — иначе при быстрой прокрутке видно белый экран, пока триггер
    // ещё не сработал.
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        play();
      });
    }, { threshold: 0, rootMargin: '0px 0px 350px 0px' });

    observer.observe(section);
  } catch (err) {
    done();
  }
})();
