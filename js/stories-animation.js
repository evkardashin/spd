(function () {
  'use strict';

  // Предохранитель: что бы ни случилось, блок не должен остаться скрытым навсегда.
  var safetyTimer = setTimeout(function () {
    if (window.__storiesReveal) window.__storiesReveal();
  }, 6000);

  function done() {
    clearTimeout(safetyTimer);
    if (window.__storiesReveal) window.__storiesReveal();
  }

  if (typeof window.gsap === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
    done();
    return;
  }

  try {
    var gsap = window.gsap;
    var section = document.querySelector('.stories_section');
    if (!section) { done(); return; }

    var heading = section.querySelectorAll('[data-stories-el="heading"]');
    var icons = section.querySelectorAll('[data-stories-el="icon"]');
    var rows = section.querySelectorAll('[data-stories-el="row"]');
    var cta = section.querySelector('[data-stories-el="cta"]');

    gsap.set(heading, { opacity: 0, y: 26 });
    gsap.set(icons, { opacity: 0, scale: 0.5, rotate: -25 });
    rows.forEach(function (row, index) {
      gsap.set(row, {
        opacity: 0,
        x: index % 2 === 0 ? -64 : 64,
        y: 18,
        scale: 0.97
      });
    });
    if (cta) gsap.set(cta, { opacity: 0, y: 20, scale: 0.88, rotate: -4 });

    var rowImages = [];
    rows.forEach(function (row) {
      var imgs = row.querySelectorAll('img, video');
      if (imgs.length) {
        gsap.set(imgs, { borderRadius: '32%' });
        rowImages.push(imgs);
      }
    });

    function play() {
      var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: done });

      tl.to(heading, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 });

      tl.to(icons, {
        opacity: 1, scale: 1, rotate: 0, duration: 0.55, stagger: 0.06, ease: 'back.out(2.4)'
      }, '-=0.3');

      // Ряды карточек — группами, с небольшим сдвигом друг за другом. Баунс — на
      // transform/opacity ряда; border-radius карточек отдельным плавным твином
      // (у back.out есть перелёт значения, который утянул бы радиус в 0 — угол на
      // мгновение стал бы острым, см. такой же приём в hero-animation.js).
      rows.forEach(function (row, i) {
        var position = i === 0 ? '-=0.16' : '-=0.5';
        tl.to(row, {
          opacity: 1, x: 0, y: 0, scale: 1, duration: 0.55, ease: 'power3.out'
        }, position);
        if (rowImages[i]) {
          tl.to(rowImages[i], { borderRadius: '0px', duration: 0.5, ease: 'power2.out' }, '<');
        }
      });

      if (cta) {
        tl.to(cta, { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2.2)' }, '-=0.22');
      }
    }

    // rootMargin растягивает зону наблюдения на 350px ниже реального вьюпорта:
    // анимация стартует чуть заранее, пока секция ещё подъезжает снизу, и к
    // моменту, когда она реально попадёт в кадр, уже не будет "пустого" вида
    // при быстрой прокрутке.
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
