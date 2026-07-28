(function () {
  'use strict';

  // Предохранитель на случай, если секция вообще не найдётся/GSAP не подключится —
  // тогда просто снимаем скрытие сразу (см. ниже) и ничего не анимируем.
  function revealAllNow() {
    if (window.__workshopReveal) window.__workshopReveal();
  }

  if (typeof window.gsap === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
    revealAllNow();
    return;
  }

  try {
    var gsap = window.gsap;
    var section = document.querySelector('.workshop_section');
    if (!section) { revealAllNow(); return; }

    var heading = section.querySelectorAll('[data-workshop-el="heading"]');
    var cards = Array.prototype.slice.call(section.querySelectorAll('[data-workshop-el="card"]'));

    // У декоративных иконок в CSS свой угол наклона (roller: -15.125deg,
    // pickaxe: 25.219deg) — анимируем каждую к её собственному финальному углу,
    // а не к 0, иначе GSAP инлайн-стилем перезапишет дизайнерский наклон.
    var iconConfigs = [
      { el: section.querySelector('.roller_img_wrapper'), finalRotate: -15.125 },
      { el: section.querySelector('.pickaxe_img_wrapper'), finalRotate: 25.219 }
    ].filter(function (c) { return c.el; });

    // Карточки — это не группа, которая появляется разом, а 4 больших баннера,
    // расположенных друг под другом на весь экран. По требованию каждая должна
    // "включаться" сама по себе в момент, когда пользователь долистал именно до
    // неё, а не все вместе при входе первой в зону видимости. Поэтому здесь НЕ
    // общий триггер на секцию, а один IntersectionObserver, наблюдающий все 4
    // карточки: колбэк вызывается независимо для каждой, как только именно она
    // пересекает viewport, и после проигрыша анимации карточка перестаёт
    // наблюдаться (эффект одноразовый, не повторяется при скролле туда-обратно).

    // Скрытие уводим из-под общего CSS-класса на <html> под управление самого GSAP:
    // расставляем стартовые (невидимые/смещённые) состояния синхронно прямо сейчас,
    // а затем сразу снимаем html-класс — с этого момента видимость каждого элемента
    // полностью определяется его собственным инлайн-стилем от gsap.set/gsap.to,
    // а не одним общим переключателем на весь блок. Иначе пришлось бы либо держать
    // ВСЕ карточки скрытыми до полного окончания анимации последней (человек может
    // скроллить медленно десятки секунд — так и было бы задумано), либо снимать
    // общий класс раньше срока и рисковать разом показать ещё не проигранные карточки.
    gsap.set(heading, { opacity: 0, y: 26 });
    iconConfigs.forEach(function (c) {
      gsap.set(c.el, { opacity: 0, scale: 0.5, rotate: c.finalRotate - 25 });
    });
    cards.forEach(function (card) {
      gsap.set(card, { opacity: 0, y: 60, scale: 0.92 });
      var photo = card.querySelector('.workshop_bg_wrapper > img');
      if (photo) gsap.set(photo, { borderRadius: '26%' });
    });

    revealAllNow();

    var headingObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.to(heading, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 });
        iconConfigs.forEach(function (c, i) {
          tl.to(c.el, {
            opacity: 1, scale: 1, rotate: c.finalRotate, duration: 0.8, ease: 'back.out(2.4)'
          }, i === 0 ? '-=0.45' : '<0.1');
        });
      });
    }, { threshold: 0 });
    headingObserver.observe(section.querySelector('.workshop_heading_wrapper') || section);

    var cardObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var card = entry.target;
        obs.unobserve(card);

        var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.to(card, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.7)' });

        var photo = card.querySelector('.workshop_bg_wrapper > img');
        if (photo) {
          // Плавный ease без баунса: у back.out есть перелёт значения — на пике он
          // утянул бы border-radius ниже 0 (браузер обрежет до квадрата) и вернул
          // обратно, что выглядело бы как случайный "мигающий" угол.
          tl.to(photo, { borderRadius: '0px', duration: 0.9, ease: 'power2.out' }, '<');
        }
      });
    }, { threshold: 0 });
    cards.forEach(function (card) { cardObserver.observe(card); });
  } catch (err) {
    revealAllNow();
  }
})();
