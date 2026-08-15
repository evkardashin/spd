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

    // program_section — это на самом деле 4 независимых смысловых блока (заголовок +
    // декор-иконки + карточки), разнесённых по очень высокой секции. Каждый должен
    // появляться сам по себе по мере скролла именно к нему, а не все разом при входе
    // секции в вьюпорт. Поэтому скрытие всех элементов сразу переводим на инлайн-стили
    // GSAP (gsap.set ниже) и сразу снимаем общий html-класс — дальше каждая подгруппа
    // показывается своим собственным IntersectionObserver-триггером (та же схема, что
    // и в js/workshop-animation.js).

    // ---- 1. Заголовки + декоративные иконки (4 группы) ------------------------------
    // У части иконок в CSS свой угол наклона — анимируем к нему, а не к 0, иначе GSAP
    // инлайн-стилем перезапишет дизайнерский наклон (см. .chel_img_wrapper и т.д. в
    // css/fff-9072af.webflow.css).
    var headingGroups = [
      {
        heading: section.querySelectorAll('[data-program-el="heading-1"]'),
        icons: [
          { el: section.querySelector('.chel_img_wrapper'), finalRotate: -19.174 },
          { el: section.querySelector('.first_img_wrapper'), finalRotate: 0 },
          { el: section.querySelector('.brush-white_img_wrapper'), finalRotate: -12.395 }
        ]
      },
      {
        heading: section.querySelectorAll('[data-program-el="heading-2"]'),
        icons: [
          { el: section.querySelector('.folder_img_wrapper'), finalRotate: 28.9 },
          { el: section.querySelector('.second_img_wrapper'), finalRotate: 0 },
          { el: section.querySelector('.white_bag_img_wrapper'), finalRotate: -19.74 }
        ]
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

    // ---- 2–3. Две фазы программы и две одинаково анимированные группы карточек ----
    var introStack = section.querySelector('.program_intro_stack');
    var introSticky = section.querySelector('.program_intro_sticky');
    var cardsWrapper1 = section.querySelector('.program_carts_wrapper.mb-527');
    var cardsWrapper2 = section.querySelector('.program_carts_wrapper-2.mb-220');
    var cards1 = Array.prototype.slice.call(section.querySelectorAll('[data-program-el="cards-1"]'));
    var cards2 = Array.prototype.slice.call(section.querySelectorAll('[data-program-el="cards-2"]'));
    var phaseDesign = null;
    var phaseOffer = null;

    function buildProgramPhases() {
      if (!introStack || !introSticky || !cardsWrapper2) return;

      var designTitle = introSticky.querySelector('.program_heading_wrapper h3');
      var designImage = introSticky.querySelector('.program_img_wrapper');
      var designDescription = introSticky.querySelector('.program_description_wrapper');
      var offerHeading = section.querySelector('.offer_heading_wrapper');
      var offerImage = offerHeading && offerHeading.nextElementSibling;
      var offerDescription = offerImage && offerImage.nextElementSibling;
      if (!designTitle || !designImage || !designDescription || !offerHeading ||
          !offerImage || !offerDescription) return;

      var stage = document.createElement('div');
      stage.className = 'program_phase_stage';
      phaseDesign = document.createElement('div');
      phaseDesign.className = 'program_phase program_phase_design';
      phaseOffer = document.createElement('div');
      phaseOffer.className = 'program_phase program_phase_offer';
      phaseOffer.setAttribute('aria-hidden', 'true');

      phaseDesign.appendChild(designTitle);
      phaseDesign.appendChild(designImage);
      phaseDesign.appendChild(designDescription);
      phaseOffer.appendChild(offerHeading);
      phaseOffer.appendChild(offerImage);
      phaseOffer.appendChild(offerDescription);
      stage.appendChild(phaseDesign);
      stage.appendChild(phaseOffer);
      introSticky.appendChild(stage);

      introStack.appendChild(cardsWrapper2);
      var runway = document.createElement('div');
      runway.className = 'program_offer_runway';
      runway.setAttribute('aria-hidden', 'true');
      introStack.appendChild(runway);
      introStack.classList.add('has-offer-phase');
    }

    buildProgramPhases();

    function initProgramCards(cards, wrapper) {
      if (!cards.length || !wrapper) return null;
      var cardStep = 1;
      var ticking = false;

      function getLayoutTop(element) {
        var top = 0;
        var current = element;
        while (current) {
          top += current.offsetTop || 0;
          current = current.offsetParent;
        }
        return top;
      }

      wrapper.classList.add('program_scroll_cards');
      gsap.killTweensOf(cards);
      gsap.set(cards, { clearProps: 'transform' });
      cards.forEach(function (card, index) {
        card.classList.add('program_scroll_card');
        card.style.setProperty('--program-card-z', index + 2);
        card.style.opacity = '1';
        var info = card.querySelector('.program_cart_info_wrapper, .program_cart_info_wrapper-2');
        if (info) info.classList.add('program_scroll_info');
      });

      function measure() {
        if (cards.length > 1) {
          cardStep = Math.max(1, getLayoutTop(cards[1]) - getLayoutTop(cards[0]));
        } else {
          cardStep = Math.max(1, cards[0].offsetHeight);
        }
      }

      function render() {
        ticking = false;
        var activationPoint = window.pageYOffset + window.innerHeight * 0.72;
        var firstCardCenter = getLayoutTop(cards[0]) + cards[0].offsetHeight / 2;
        var progress = (activationPoint - firstCardCenter) / cardStep;
        progress = Math.max(0, Math.min(cards.length - 1, progress));
        var visualOffset = 0;
        var closestDistance = Infinity;
        var activeIndex = 0;

        cards.forEach(function (card, index) {
          var scale = Math.max(0.6, 1 - Math.abs(index - progress) * 0.1);
          card.style.setProperty('--program-card-scale', scale.toFixed(4));
          card.style.setProperty('--program-card-offset-y', visualOffset.toFixed(2) + 'px');
          var visualCenter = getLayoutTop(card) + visualOffset + card.offsetHeight * scale / 2;
          var distance = Math.abs(activationPoint - visualCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            activeIndex = index;
          }
          visualOffset -= card.offsetHeight * (1 - scale);
        });

        cards.forEach(function (card, index) {
          card.classList.toggle('is-active', index === activeIndex);
        });
      }

      function requestRender() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(render);
      }

      measure();
      render();
      window.addEventListener('scroll', requestRender, { passive: true });
      window.addEventListener('resize', function () { measure(); requestRender(); });
      window.addEventListener('load', function () { measure(); requestRender(); });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { measure(); requestRender(); });
      }
      return { measure: measure, render: requestRender };
    }

    var cardsAnimation1 = initProgramCards(cards1, cardsWrapper1);
    var cardsAnimation2 = initProgramCards(cards2, cardsWrapper2);

    if (phaseDesign && phaseOffer && cards1.length) {
      var phaseTicking = false;
      function renderPhaseSwitch() {
        phaseTicking = false;
        var lastCardRect = cards1[cards1.length - 1].getBoundingClientRect();
        var activationLine = window.innerHeight * 0.72;
        var fadeDistance = Math.max(180, window.innerHeight * 0.24);
        var raw = (activationLine - lastCardRect.bottom) / fadeDistance;
        var progress = Math.max(0, Math.min(1, raw));
        var eased = progress * progress * (3 - 2 * progress);

        phaseDesign.style.opacity = (1 - eased).toFixed(4);
        phaseDesign.style.transform = 'translateY(' + (-24 * eased).toFixed(2) + 'px)';
        phaseOffer.style.opacity = eased.toFixed(4);
        phaseOffer.style.transform = 'translateY(' + (24 * (1 - eased)).toFixed(2) + 'px)';
        phaseDesign.style.pointerEvents = eased < 0.5 ? 'auto' : 'none';
        phaseOffer.style.pointerEvents = eased >= 0.5 ? 'auto' : 'none';
        phaseDesign.setAttribute('aria-hidden', eased >= 0.5 ? 'true' : 'false');
        phaseOffer.setAttribute('aria-hidden', eased >= 0.5 ? 'false' : 'true');
      }

      function requestPhaseSwitch() {
        if (phaseTicking) return;
        phaseTicking = true;
        window.requestAnimationFrame(renderPhaseSwitch);
      }

      renderPhaseSwitch();
      window.addEventListener('scroll', requestPhaseSwitch, { passive: true });
      window.addEventListener('resize', requestPhaseSwitch);
      window.addEventListener('load', requestPhaseSwitch);
    }

    // Sticky снимается ровно тогда, когда последняя карточка трудоустройства
    // полностью проходит нижнюю границу постоянного заголовка «наша программка».
    if (introStack && introSticky && cards2.length) {
      var persistentTitle = introSticky.querySelector('.program_heading_wrapper h2');
      var lastOfferCard = cards2[cards2.length - 1];
      var releaseTicking = false;
      var isIntroReleased = false;
      var releaseScrollY = 0;
      var releaseRunway = 0;
      var followingGrid = section.querySelector('.program_cart_grid');
      var offerDescription = phaseOffer && phaseOffer.querySelector('.program_description_wrapper');
      var followingGapAligned = false;

      // The runway is needed to keep the intro sticky until the final offer card
      // passes the persistent title. It must not, however, become visible empty
      // space before the following card grid. Once the final offer card is active,
      // its end position is stable, so pull the next grid forward to leave 120px
      // below the visible offer description at the exact release point.
      function alignFollowingGrid() {
        if (followingGapAligned || !followingGrid || !offerDescription ||
            !lastOfferCard.classList.contains('is-active')) return;

        var finalCardScale = parseFloat(
          window.getComputedStyle(lastOfferCard).getPropertyValue('--program-card-scale')
        );
        if (!isFinite(finalCardScale) || finalCardScale < 0.999) return;

        var titleBottom = persistentTitle.getBoundingClientRect().bottom;
        var descriptionBottom = offerDescription.getBoundingClientRect().bottom;
        var lastCardDocumentBottom = lastOfferCard.getBoundingClientRect().bottom + window.pageYOffset;
        var releaseDocumentY = lastCardDocumentBottom - titleBottom;
        var desiredGridDocumentTop = releaseDocumentY + descriptionBottom + 120;
        var currentGridDocumentTop = followingGrid.getBoundingClientRect().top + window.pageYOffset;
        var currentMarginBottom = parseFloat(window.getComputedStyle(introStack).marginBottom) || 0;

        introStack.style.marginBottom =
          (currentMarginBottom + desiredGridDocumentTop - currentGridDocumentTop).toFixed(2) + 'px';
        followingGapAligned = true;
      }

      function measureReleaseRunway() {
        if (!persistentTitle) return;
        releaseRunway = Math.max(
          0,
          introSticky.offsetHeight - persistentTitle.offsetHeight + window.innerHeight * 0.62
        );
        introStack.style.setProperty('--program-offer-runway', releaseRunway + 'px');
      }

      function releaseIntro() {
        var stackRect = introStack.getBoundingClientRect();
        var introRect = introSticky.getBoundingClientRect();
        var topInsideStack = introRect.top - stackRect.top;
        introStack.style.paddingTop = introSticky.offsetHeight + 'px';
        introSticky.style.top = topInsideStack.toFixed(2) + 'px';
        introSticky.classList.add('is-released');

        // Correct the last sub-pixel/scroll-frame difference at the real release
        // frame so the visible gap is exactly 120px.
        if (followingGrid && offerDescription) {
          var releasedGap = followingGrid.getBoundingClientRect().top -
            offerDescription.getBoundingClientRect().bottom;
          var releasedMargin = parseFloat(window.getComputedStyle(introStack).marginBottom) || 0;
          introStack.style.marginBottom =
            (releasedMargin + 120 - releasedGap).toFixed(2) + 'px';
        }

        releaseScrollY = window.pageYOffset;
        isIntroReleased = true;
      }

      function restoreIntro() {
        introSticky.classList.remove('is-released');
        introSticky.style.removeProperty('top');
        introStack.style.removeProperty('padding-top');
        isIntroReleased = false;
      }

      function renderIntroRelease() {
        releaseTicking = false;
        if (!persistentTitle) return;

        alignFollowingGrid();

        if (isIntroReleased) {
          if (window.pageYOffset < releaseScrollY) restoreIntro();
          return;
        }

        var titleBottom = persistentTitle.getBoundingClientRect().bottom;
        var lastCardBottom = lastOfferCard.getBoundingClientRect().bottom;
        if (lastCardBottom <= titleBottom) releaseIntro();
      }

      function requestIntroRelease() {
        if (releaseTicking) return;
        releaseTicking = true;
        window.requestAnimationFrame(renderIntroRelease);
      }

      measureReleaseRunway();
      renderIntroRelease();
      window.addEventListener('scroll', requestIntroRelease, { passive: true });
      window.addEventListener('resize', function () {
        restoreIntro();
        introStack.style.removeProperty('margin-bottom');
        followingGapAligned = false;
        measureReleaseRunway();
        requestIntroRelease();
      });
      window.addEventListener('load', function () {
        measureReleaseRunway();
        requestIntroRelease();
      });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          measureReleaseRunway();
          requestIntroRelease();
        });
      }
    }

    // ---- 4. program_cart_grid (6 карточек, сетка 3×2) -------------------------------
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

    // ---- 5. support_carts_wrapper (3 карточки в один ряд) + финальная кнопка -------
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
