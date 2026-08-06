(function () {
  'use strict';

  function revealAllNow() {
    if (window.__faqReveal) window.__faqReveal();
  }

  if (typeof window.gsap === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
    revealAllNow();
    return;
  }

  try {
    var gsap = window.gsap;
    var section = document.querySelector('.faq_section');
    if (!section) { revealAllNow(); return; }

    var heading = section.querySelectorAll('[data-faq-el="heading"]');
    var cards = Array.prototype.slice.call(section.querySelectorAll('[data-faq-el="card"]'));

    // Как и в program_carts_wrapper: карточки — вертикальный стек, каждая появляется
    // сама по себе по мере скролла именно к ней, а не все разом. Поэтому скрытие сразу
    // переводим на инлайн-стили GSAP и снимаем общий html-класс немедленно (см.
    // комментарий в js/workshop-animation.js) — дальше каждая карточка следит за собой
    // через свой собственный IntersectionObserver-триггер.
    gsap.set(heading, { opacity: 0, y: 26 });
    cards.forEach(function (card, index) {
      // Радиус (36px, задан в CSS) лежит на самой .faq_item — это текстовая карточка
      // с overflow:hidden, а не картинка, поэтому морфим радиус прямо на ней.
      gsap.set(card, {
        opacity: 0,
        x: index % 2 === 0 ? -38 : 38,
        y: 12,
        scale: 0.96,
        rotate: index % 2 === 0 ? -1.2 : 1.2,
        borderRadius: '46%'
      });
    });

    revealAllNow();

    if (heading.length) {
      var headingObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          obs.disconnect();
          gsap.to(heading, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' });
        });
      }, { threshold: 0 });
      headingObserver.observe(heading[0]);
    }

    // Карточки короткие (это текстовые вопросы, а не полноэкранные баннеры как в
    // workshop/program), поэтому нередко несколько сразу умещаются в вьюпорте и их
    // IntersectionObserver-колбэк срабатывает для них одним пакетом в один и тот же
    // тик. playOrder считает, какая по счёту карточка уже запущена, и добавляет
    // небольшую нарастающую задержку — так появление всё равно выглядит "по очереди",
    // а не вспышкой разом, даже если все они видны одновременно.
    var playOrder = 0;
    var cardObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var card = entry.target;
        obs.unobserve(card);
        var delay = playOrder * 0.12;
        playOrder += 1;
        var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: delay });
        tl.to(card, {
          opacity: 1, x: 0, y: 0, scale: 1, rotate: 0,
          duration: 0.8, ease: 'power3.out'
        });
        // Плавный ease без баунса — иначе перелёт back.out утянет радиус за 0
        // (видимый "квадратный" мигающий угол на пике пружины).
        tl.to(card, { borderRadius: '36px', duration: 0.85, ease: 'power2.out' }, '<');
      });
    }, { threshold: 0 });
    cards.forEach(function (card) { cardObserver.observe(card); });
  } catch (err) {
    revealAllNow();
  }
})();
