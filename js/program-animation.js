(function () {
  'use strict';

  function revealAllNow() {
    if (window.__programReveal) window.__programReveal();
    // Фолбэк-путь (GSAP/IntersectionObserver недоступны, секции нет, ошибка)
    // — ничего не анимируется, конфликтовать с CSS-hover нечему, флаг можно
    // ставить сразу. На обычном пути его для program_blank_wrapper ставит
    // сам твин карточек (см. obs3 ниже) — здесь это просто безопасный сейфти-нет.
    document.documentElement.classList.add('program-cards-ready');
  }

  if (typeof window.gsap === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
    revealAllNow();
    return;
  }

  try {
    var gsap = window.gsap;
    var section = document.querySelector('.program_section');
    if (!section) { revealAllNow(); return; }

    // program_section — это на самом деле несколько независимых смысловых блоков
    // (заголовок + декор-иконки + карточки), разнесённых по высокой секции. Каждый должен
    // появляться сам по себе по мере скролла именно к нему, а не все разом при входе
    // секции в вьюпорт. Поэтому скрытие всех элементов сразу переводим на инлайн-стили
    // GSAP (gsap.set ниже) и сразу снимаем общий html-класс — дальше каждая подгруппа
    // показывается своим собственным IntersectionObserver-триггером (та же схема, что
    // и в js/workshop-animation.js).

    // ---- 1. Заголовки + декоративные иконки (3 группы) ------------------------------
    // У части иконок в CSS свой угол наклона — анимируем к нему, а не к 0, иначе GSAP
    // инлайн-стилем перезапишет дизайнерский наклон (см. .chel_img_wrapper и т.д. в
    // css/fff-9072af.webflow.css).
    var headingGroups = [
      {
        heading: section.querySelectorAll('[data-program-el="heading-1"]'),
        icons: []
      },
      {
        heading: section.querySelectorAll('[data-program-el="heading-3"]'),
        icons: [
          { el: section.querySelector('.pdf_img_wrapper._1'), finalRotate: 0 },
          { el: section.querySelector('.pdf_img_wrapper._2'), finalRotate: 0 }
        ]
      },
      {
        heading: section.querySelectorAll('[data-program-el="heading-4"]'),
        icons: [
          { el: section.querySelector('.diamomd_img_wrapper'), finalRotate: -17.791 },
          { el: section.querySelector('.fire_img_wrapper'), finalRotate: 23.454 }
        ]
      }
    ];

    headingGroups.forEach(function (group) {
      var icons = group.icons.filter(function (c) { return c.el; });
      if (!group.heading.length && !icons.length) return;

      gsap.set(group.heading, { opacity: 0, y: 26 });
      icons.forEach(function (c) {
        gsap.set(c.el, { opacity: 0, scale: 0.5, rotate: c.finalRotate - 25 });
      });

      // heading-3 отдаёт под одним data-атрибутом сразу десктопный и мобильный
      // варианты заголовка (.pdf_heading_wrapper / .pdf_heading_wrapper-mob) —
      // в DOM первым идёт десктопный. Если взять его триггером на мобилке, где
      // он display:none, у него нет layout-бокса, и IntersectionObserver
      // никогда не отдаст isIntersecting:true — вся группа (включая видимый
      // мобильный заголовок и иконки) так и останется с opacity:0. Поэтому
      // берём первый РЕАЛЬНО отрендеренный элемент (offsetParent !== null).
      var visibleHeading = Array.prototype.filter.call(group.heading, function (el) {
        return el.offsetParent !== null;
      })[0];
      var trigger = visibleHeading || group.heading[0] || icons[0].el;
      var obs = new IntersectionObserver(function (entries, o) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          o.disconnect();
          var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          tl.to(group.heading, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 });
          icons.forEach(function (c, i) {
            tl.to(c.el, {
              opacity: 1, scale: 1, rotate: c.finalRotate, duration: 0.55, ease: 'back.out(2.4)'
            }, i === 0 ? '-=0.3' : '<0.06');
          });
        });
        // rootMargin: анимация стартует на 350px раньше, чем группа реально
        // войдёт в вьюпорт — меньше шанс увидеть белый экран при быстром скролле.
      }, { threshold: 0, rootMargin: '0px 0px 350px 0px' });
      obs.observe(trigger);
    });

    // ---- 2. Темы программы и панель содержимого ------------------------------------
    // transform снимаем после появления: на мобилке темы лежат в горизонтальной
    // ленте, и инлайн-сдвиг не должен оставаться на её элементах.
    var programTabs = section.querySelector('[data-program-tabs]');
    var tabItems = section.querySelectorAll('[data-program-el="tabs"]');

    if (programTabs && tabItems.length) {
      gsap.set(tabItems, { opacity: 0, y: 40 });

      var obsTabs = new IntersectionObserver(function (entries, o) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          o.disconnect();
          gsap.to(tabItems, {
            opacity: 1, y: 0, duration: 0.55, stagger: 0.05, ease: 'power3.out', clearProps: 'transform'
          });
        });
      }, { threshold: 0, rootMargin: '0px 0px 350px 0px' });
      obsTabs.observe(programTabs);
    }

    // ---- 3. program_cart_grid (6 карточек, сетка 3×2) -------------------------------
    // У каждой свой угол наклона в CSS (program_blank_wrapper._1.._6) — сохраняем его,
    // как и с иконками. Появляются рядами по 3, весь блок — один общий триггер (как
    // mentor/case), а не поштучно, т.к. это компактная сетка, а не длинный стек.
    var cards3Config = [
      { el: section.querySelector('.program_blank_wrapper._1'), finalRotate: 0.358 },
      { el: section.querySelector('.program_blank_wrapper._2'), finalRotate: -2.858 },
      { el: section.querySelector('.program_blank_wrapper._3'), finalRotate: 1.626 },
      { el: section.querySelector('.program_blank_wrapper._4'), finalRotate: -2.103 },
      { el: section.querySelector('.program_blank_wrapper._5'), finalRotate: 1.737 },
      { el: section.querySelector('.program_blank_wrapper._6'), finalRotate: -0.893 }
    ].filter(function (c) { return c.el; });

    cards3Config.forEach(function (c) {
      gsap.set(c.el, { opacity: 0, y: 40, scale: 0.9, rotate: c.finalRotate - 20 });
      var img = c.el.querySelector('img');
      if (img) gsap.set(img, { borderRadius: '34%' });
    });

    if (cards3Config.length) {
      var ROW3 = 3;
      var rows3 = [];
      for (var i = 0; i < cards3Config.length; i += ROW3) rows3.push(cards3Config.slice(i, i + ROW3));

      var obs3 = new IntersectionObserver(function (entries, o) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          o.disconnect();
          // onComplete ставит флаг для CSS-hover карточек (см.
          // .program_blank_wrapper:hover в fff-9072af.webflow.css) — тем же
          // способом, что consultation-cards-ready/rate-cards-ready в
          // соседних *-animation.js: пока эта анимация появления идёт, CSS
          // transition на transform спорил бы с GSAP, который сам пишет
          // transform инлайново на каждом кадре.
          var tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            onComplete: function () { document.documentElement.classList.add('program-cards-ready'); }
          });
          rows3.forEach(function (row, ri) {
            row.forEach(function (c, ci) {
              var position = ri === 0 && ci === 0 ? 0 : (ci === 0 ? '-=0.38' : '<0.06');
              tl.to(c.el, {
                opacity: 1, y: 0, scale: 1, rotate: c.finalRotate, duration: 0.55, ease: 'back.out(1.7)',
                // Иначе инлайн transform от GSAP навсегда перебивает CSS :hover.
                clearProps: 'transform'
              }, position);
              var img = c.el.querySelector('img');
              if (img) tl.to(img, { borderRadius: '0px', duration: 0.55, ease: 'power2.out' }, '<');
            });
          });
        });
      }, { threshold: 0, rootMargin: '0px 0px 350px 0px' });
      obs3.observe(cards3Config[0].el);
    }

    // ---- 4. support_carts_wrapper (3 карточки в один ряд) + финальная кнопка -------
    // У .support_cart_wrapper уже есть встроенный (см. code-embed в разметке) CSS-hover
    // эффект на transform (увеличение при наведении). GSAP пишет transform инлайн-стилем
    // поверх любых CSS-правил, поэтому после входной анимации обязательно снимаем его
    // через clearProps — иначе hover навсегда перестанет работать.
    var cards4 = Array.prototype.slice.call(section.querySelectorAll('[data-program-el="cards-4"]'));
    var cta4 = section.querySelector('[data-program-el="cta-4"]');
    cards4.forEach(function (card) {
      gsap.set(card, { opacity: 0, y: 50, scale: 0.9 });
    });
    if (cta4) gsap.set(cta4, { opacity: 0, y: 20, scale: 0.9, rotate: -3 });

    if (cards4.length || cta4) {
      var obs4 = new IntersectionObserver(function (entries, o) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          o.disconnect();
          var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          if (cards4.length) {
            tl.to(cards4, {
              opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.08, ease: 'back.out(1.7)',
              clearProps: 'transform'
            });
          }
          if (cta4) {
            tl.to(cta4, {
              opacity: 1, y: 0, scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2.2)'
            }, cards4.length ? '-=0.26' : 0);
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px 350px 0px' });
      obs4.observe(cards4[0] || cta4);
    }

    revealAllNow();
  } catch (err) {
    revealAllNow();
  }
})();
