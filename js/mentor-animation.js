(function () {
  'use strict';

  // Предохранитель: что бы ни случилось, блок не должен остаться скрытым навсегда.
  var safetyTimer = setTimeout(function () {
    if (window.__mentorReveal) window.__mentorReveal();
  }, 6000);

  function done() {
    clearTimeout(safetyTimer);
    if (window.__mentorReveal) window.__mentorReveal();
  }

  if (typeof window.gsap === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
    done();
    return;
  }

  try {
    var gsap = window.gsap;
    var section = document.querySelector('.mentor_section');
    if (!section) { done(); return; }

    var heading = section.querySelectorAll('[data-mentor-el="heading"]');
    var cards = Array.prototype.slice.call(section.querySelectorAll('[data-mentor-el="card"]'));
    var callPanel = section.querySelector('[data-mentor-el="call"]');

    // У декоративных иконок в CSS свой угол наклона (oscar_img_wrapper: 17deg,
    // book_img_wrapper: -17deg) — если анимировать все разом к rotate:0, GSAP
    // перезапишет инлайн-стилем и наклон навсегда потеряется. Поэтому у каждой
    // свой финальный угол, взятый из css/fff-9072af.webflow.css.
    var iconConfigs = [
      { el: section.querySelector('.oscar_img_wrapper'), finalRotate: 17 },
      { el: section.querySelector('.book_img_wrapper'), finalRotate: -17 }
    ].filter(function (c) { return c.el; });

    // Карточки лежат в CSS-гриде 4 колонки × 3 ряда (.mentor_grid), поэтому каждые
    // 4 подряд идущих элемента — это визуальный ряд. Появляются по рядам:
    // сначала весь первый ряд, затем второй и т.д.
    var ROW_SIZE = 4;
    var rows = [];
    for (var i = 0; i < cards.length; i += ROW_SIZE) {
      rows.push(cards.slice(i, i + ROW_SIZE));
    }

    gsap.set(heading, { opacity: 0, y: 26 });
    iconConfigs.forEach(function (c) {
      gsap.set(c.el, { opacity: 0, scale: 0.5, rotate: c.finalRotate - 25 });
    });
    cards.forEach(function (card, index) {
      var column = index % ROW_SIZE;
      var fromX = [-72, -28, 28, 72][column];
      gsap.set(card, {
        opacity: 0,
        x: fromX,
        y: 22 + Math.abs(fromX) * 0.12,
        scale: 0.9,
        rotate: fromX < 0 ? -4 : 4
      });
    });
    if (callPanel) gsap.set(callPanel, { opacity: 0, y: 28, scale: 0.84 });

    // Основное фото карточки — не круглая аватарка (та уже .border-999, круглая
    // всегда), а именно фон — стартует скруглённым "блобом" и доезжает до 0.
    var cardPhotos = cards.map(function (card) {
      return card.querySelector(':scope > img');
    });
    gsap.set(cardPhotos.filter(Boolean), { borderRadius: '38%' });

    function play() {
      var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: done });

      tl.to(heading, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 });
      iconConfigs.forEach(function (c, i) {
        tl.to(c.el, {
          opacity: 1, scale: 1, rotate: c.finalRotate, duration: 0.8, ease: 'back.out(2.4)'
        }, i === 0 ? '-=0.45' : '<0.1');
      });

      rows.forEach(function (row, i) {
        var position = i === 0 ? '-=0.25' : '-=0.7';
        tl.to(row, {
          opacity: 1, x: 0, y: 0, scale: 1, rotate: 0,
          duration: 0.85, stagger: { each: 0.07, from: 'center' }, ease: 'back.out(1.65)'
        }, position);

        var photos = row.map(function (card) { return card.querySelector(':scope > img'); }).filter(Boolean);
        if (photos.length) {
          // Плавный ease без баунса: у back.out есть перелёт значения — на пике он
          // утянул бы border-radius ниже 0 (браузер обрежет до квадрата) и вернул
          // обратно, что выглядело бы как случайный "мигающий" угол.
          tl.to(photos, { borderRadius: '0px', duration: 0.8, stagger: 0.08, ease: 'power2.out' }, '<');
        }
      });

      if (callPanel) {
        tl.to(callPanel, {
          opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.65)'
        }, '-=0.45');
      }
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
