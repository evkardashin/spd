/*
 * Собственная замена интерактивности, которую раньше давал js/webflow.js.
 * Сайт больше не хостится на Webflow, поэтому вместо их рантайма (и jQuery,
 * который был нужен только ему) здесь два независимых блока:
 *   1. FAQ-аккордеон на основе классов .w-dropdown (разметка Webflow сохранена,
 *      т.к. вся вёрстка/CSS уже завязаны на эти классы).
 *   2. Попапы (.popup, .popup_program, .popup_nav_mob, .popup_transparent_mob) —
 *      открытие/закрытие по data-атрибутам, Escape, клик по затемнению, блокировка скролла.
 */
(function () {
  'use strict';

  /* ---------- 1. FAQ-аккордеон (.w-dropdown) ---------- */

  function initDropdowns() {
    var dropdowns = document.querySelectorAll('.w-dropdown');

    dropdowns.forEach(function (dropdown) {
      var toggle = dropdown.querySelector('.w-dropdown-toggle');
      var list = dropdown.querySelector('.w-dropdown-list');
      if (!toggle || !list) return;

      toggle.addEventListener('click', function (event) {
        event.preventDefault();
        var isOpen = list.classList.contains('w--open');
        setDropdownState(toggle, list, !isOpen);
      });
    });

    // Клик вне открытого дропдауна и Escape — закрывают его (стандартное поведение Webflow).
    document.addEventListener('click', function (event) {
      dropdowns.forEach(function (dropdown) {
        if (dropdown.contains(event.target)) return;
        var toggle = dropdown.querySelector('.w-dropdown-toggle');
        var list = dropdown.querySelector('.w-dropdown-list');
        if (toggle && list && list.classList.contains('w--open')) {
          setDropdownState(toggle, list, false);
        }
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      dropdowns.forEach(function (dropdown) {
        var toggle = dropdown.querySelector('.w-dropdown-toggle');
        var list = dropdown.querySelector('.w-dropdown-list');
        if (toggle && list) setDropdownState(toggle, list, false);
      });
    });
  }

  function setDropdownState(toggle, list, open) {
    if (list.classList.contains('w--open') === open) return;
    toggle.classList.toggle('w--open', open);

    // .dropdown-list.w--open на мобилке даёт свой (меньший) padding — если
    // снять класс со списка СРАЗУ, до начала анимации закрытия, паддинг
    // мгновенно скачком вернётся к базовому значению за кадр до того, как
    // GSAP успеет зафиксировать стартовые числа для твина, и текст дёрнется.
    // Поэтому при закрытии класс снимаем только в onComplete анимации —
    // на открытии, наоборот, ставим сразу: измерение целевых paddingTop/
    // paddingBottom в animateDropdown должно опираться уже на open-состояние.
    if (open) {
      list.classList.add('w--open');
      animateDropdown(list, true);
    } else {
      animateDropdown(list, false, function () {
        list.classList.remove('w--open');
      });
    }
  }

  // Плавное раскрытие FAQ-аккордеона — по образцу остальных reveal-анимаций на
  // сайте (fade + небольшой сдвиг по Y, power3.out). Без GSAP просто остаёмся
  // на мгновенном CSS-переключении через .w-dropdown-list.w--open{display:block}
  // (см. css/webflow.css) — .w--open уже выставлен выше, так что фоллбэк рабочий.
  function animateDropdown(list, open, onSettled) {
    if (typeof window.gsap === 'undefined') {
      if (onSettled) onSettled();
      return;
    }
    var gsap = window.gsap;
    var content = list.querySelector('.dropdown_list_text_wrapper') || list;
    var card = list.closest('.faq_item');

    gsap.killTweensOf(list);
    gsap.killTweensOf(content);
    if (card) {
      gsap.killTweensOf(card);
      gsap.set(card, { scaleX: 1, scaleY: 1, transformOrigin: '50% 0%' });
    }

    if (open) {
      list.style.display = 'block';

      // Высоту и паддинги (у .dropdown-list задан padding-bottom) меряем в их
      // естественном, ещё не схлопнутом состоянии — GSAP не умеет корректно
      // домерить height:'auto', если в этом же твине одновременно едет и
      // padding: на первом кадре паддинг ещё 0, и авто-высота посчитается
      // заниженной. Поэтому меряем сами и анимируем к готовым числам.
      var padTop = getComputedStyle(list).paddingTop;
      var padBottom = getComputedStyle(list).paddingBottom;
      var fullHeight = list.getBoundingClientRect().height;

      gsap.set(list, { height: 0, paddingTop: 0, paddingBottom: 0, overflow: 'hidden' });
      gsap.set(content, { opacity: 0, y: 12 });

      var tl = gsap.timeline({
        onComplete: function () {
          // height:auto (а не фиксированный px) — чтобы список не обрезался,
          // если после анимации сменится ширина/перенос строк текста.
          gsap.set(list, { height: 'auto', clearProps: 'overflow' });
        }
      });
      tl.to(list, {
        height: fullHeight, paddingTop: padTop, paddingBottom: padBottom,
        duration: 0.45, ease: 'power3.out'
      });
      tl.to(content, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.25');

      // После начала раскрытия вся карточка делает один заметный, но аккуратный
      // вдох: немного расширяется по горизонтали и сильнее по вертикали, затем
      // с одним мягким overshoot возвращается к исходному размеру.
      if (card) {
        tl.to(card, {
          scaleX: 1.025,
          scaleY: 1.045,
          duration: 0.22,
          ease: 'power2.out'
        }, 0.12);
        tl.to(card, {
          scaleX: 1,
          scaleY: 1,
          duration: 0.42,
          ease: 'back.out(1.9)'
        }, '>');
      }
    } else {
      var currentHeight = list.getBoundingClientRect().height;
      gsap.set(list, { height: currentHeight, overflow: 'hidden' });

      var tlClose = gsap.timeline({
        onComplete: function () {
          list.style.display = 'none';
          gsap.set(list, { clearProps: 'height,paddingTop,paddingBottom,overflow' });
          gsap.set(content, { clearProps: 'opacity,transform' });
          if (onSettled) onSettled();
        }
      });
      tlClose.to(content, { opacity: 0, y: 8, duration: 0.2, ease: 'power2.in' }, 0);
      tlClose.to(list, { height: 0, paddingTop: 0, paddingBottom: 0, duration: 0.35, ease: 'power2.in' }, 0);
    }
  }

  /* ---------- 2. Попапы ---------- */

  function initPopups() {
    var openBtns = document.querySelectorAll('[data-popup-open]');
    var closeBtns = document.querySelectorAll('[data-popup-close]');

    openBtns.forEach(function (btn) {
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        var popup = document.getElementById(btn.getAttribute('data-popup-open'));
        if (popup) openPopup(popup);
      });
    });

    closeBtns.forEach(function (btn) {
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        var popup = btn.closest('[id^="popup"]');
        if (popup) closePopup(popup);

        // Пункты мобильного меню (popup-nav-mob) — обычные ссылки на секции
        // (href="#program" и т.п.), а не просто кнопки закрытия: после закрытия
        // попапа докручиваем страницу к нужной секции.
        var href = btn.getAttribute('href');
        if (href && href.length > 1 && href.charAt(0) === '#') {
          var target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Закрытие по клику мимо контента не реализовано намеренно: у попапов нет
    // отдельного элемента-подложки — .container занимает всю площадь попапа,
    // поэтому "клик снаружи" неотличим от клика по контенту. Закрытие — по
    // кнопке "закрыть"/"закрываем" (data-popup-close) и по Escape.
    //
    // Исключение — попапы .popup / .popup_program (например popup-testimonial,
    // popup-program и все popup-program-*): лист(-ы) в них прижаты
    // к низу (.popup_content_wrapper — align-items: flex-end), а сам wrapper
    // растянут на всю высоту попапа, поэтому над листом всегда остаётся
    // пустая зона — клик по ней бьёт именно в .popup_content_wrapper, а не в
    // дочерний элемент, и однозначно отличим от клика по контенту. На
    // мобилке (≤479px) правая панель (.popup_right_side_program /
    // .popup_right_side) вдобавок скрыта (см. CSS), так что пустая зона
    // расширяется ещё и вправо от листа — работает тем же обработчиком.
    // Селектор по классам (.popup, .popup_program), а не по конкретному id —
    // так это универсально для любых текущих/будущих попапов такого вида.
    document.querySelectorAll('.popup, .popup_program').forEach(function (popup) {
      var wrapper = popup.querySelector('.popup_content_wrapper');
      if (!wrapper) return;
      wrapper.addEventListener('click', function (event) {
        if (event.target !== wrapper) return;
        closePopup(popup);
      });
    });

    // popup-nav-mob — та же идея, но зона "снаружи" шире: там ещё есть
    // .popup_line-copy (ручка) рядом с панелью, а не только пустой фон
    // обёртки, поэтому здесь удобнее проверять "клик НЕ внутри .popup_mob_bg",
    // а не строгое равенство target === wrapper.
    (function () {
      var navMobWrapper = document.querySelector('#popup-nav-mob .popup_content_mob_wrapper');
      if (!navMobWrapper) return;
      navMobWrapper.addEventListener('click', function (event) {
        if (event.target.closest('.popup_mob_bg')) return;
        if (!window.matchMedia('(max-width: 479px)').matches) return;
        closePopup(document.getElementById('popup-nav-mob'));
      });
    })();

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      document.querySelectorAll('[id^="popup"]').forEach(function (popup) {
        if (isOpen(popup)) closePopup(popup);
      });
    });
  }

  function isOpen(popup) {
    return popup.style.display === 'flex';
  }

  function openPopup(popup) {
    popup.style.display = 'flex';
    lockScroll();
    playSlideAnimation(popup, 'in');
  }

  function closePopup(popup) {
    var finish = function () {
      popup.style.display = 'none';
      if (!document.querySelector('[id^="popup"][style*="flex"]')) unlockScroll();
    };
    if (!playSlideAnimation(popup, 'out', finish)) finish();
  }

  // Попапы с data-popup-animate="slide-up" (#popup-testimonial, #popup-program,
  // #popup-nav-mob) выезжают с края экрана: сам попап (тёмная подложка)
  // появляется мгновенно через display, а .popup_line/лист(-ы) уезжают
  // трансформом — это не требует anti-flicker-класса на <html>, как у секций
  // на скролле (см. комментарий в <head>), потому что попап и так
  // display:none по умолчанию. Если GSAP не загрузился — попап остаётся
  // мгновенным (as-is поведение), см. return false ниже.
  //
  // Селектор листов через [class*=...] — у каждого попапа своё имя класса
  // листа: .popup_left_side/.popup_right_side (testimonial),
  // .popup_left_side_program-copy/.popup_right_side_program (program),
  // .popup_mob_bg (nav-mob). Ручка тоже называется по-разному:
  // .popup_line (testimonial/program) или .popup_line-copy (nav-mob).
  //
  // По умолчанию лист доковано снизу и въезжает оттуда (yPercent 100 → 0).
  // #popup-nav-mob — редкое исключение: панель доковано сверху (см. CSS
  // .popup_content_mob_wrapper), поэтому у него data-popup-slide-from="top" —
  // это просто меняет знак дистанции на противоположный (-100 вместо 100),
  // сама механика анимации общая.
  function playSlideAnimation(popup, direction, onComplete) {
    if (popup.getAttribute('data-popup-animate') !== 'slide-up') return false;
    if (typeof window.gsap === 'undefined') return false;

    var gsap = window.gsap;
    var line = popup.querySelector('.popup_line, .popup_line-copy');
    var sheets = Array.prototype.slice.call(
      popup.querySelectorAll('[class*="popup_left_side"], [class*="popup_right_side"], .popup_mob_bg')
    );
    if (!sheets.length) return false;

    var panels = (line ? [line] : []).concat(sheets);
    gsap.killTweensOf(panels);

    var fromTop = popup.getAttribute('data-popup-slide-from') === 'top';
    var offscreenYPercent = fromTop ? -100 : 100;

    // У .popup_line своя абсолютная позиция (это "ручка" рядом с листом, не
    // flex-элемент), а её собственная высота — 0.5rem, поэтому yPercent от неё
    // самой почти незаметен. Сдвигаем её на ту же дистанцию, что и лист,
    // измеренную в моменте открытия — так она едет вместе с листом что на
    // десктопе, что в мобильной раскладке (там правая панель скрыта через
    // display:none, offsetHeight = 0 и не участвует в подсчёте максимума).
    var travel = Math.max.apply(null, sheets.map(function (el) { return el.offsetHeight; }).concat([300]));
    var lineOffset = fromTop ? -travel : travel;

    if (direction === 'in') {
      gsap.set(sheets, { yPercent: offscreenYPercent });
      if (line) gsap.set(line, { y: lineOffset });

      var tlIn = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tlIn.to(sheets, { yPercent: 0, duration: 0.5, stagger: 0.05 }, 0);
      if (line) tlIn.to(line, { y: 0, duration: 0.5 }, 0.05);
    } else {
      var tlOut = gsap.timeline({ defaults: { ease: 'power2.in' }, onComplete: onComplete });
      tlOut.to(sheets, { yPercent: offscreenYPercent, duration: 0.32 }, 0);
      if (line) tlOut.to(line, { y: lineOffset, duration: 0.32 }, 0);
    }

    return true;
  }

  function lockScroll() {
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.documentElement.style.overflow = '';
  }

  /* ---------- 3. Попап "Программа": кнопка "дальше" листает страницы ----------
   *
   * #popup-program — один и тот же DOM-элемент всегда (белые листы
   * .popup_left_side_program-copy/.popup_right_side_program никогда не
   * пересоздаются). "Дальше" не открывает другой попап, а подменяет
   * контент внутри: бейдж-дату/заголовок/описание слева и грид карточек
   * справа (и в мобильном гриде) — с анимацией "старое улетает вверх,
   * новое въезжает снизу", подрезанной по границе .popup_program_page_left /
   * .popup_program_page_cards (см. CSS), а не по краю листа.
   *
   * Контент каждой страницы живёт в <template data-program-page="…"> в
   * HTML — редактировать текст/картинки нужно там, этот код только читает
   * их и рендерит. Порядок круга — PROGRAM_PAGE_ORDER ниже, должен
   * совпадать с порядком <template> в HTML (там это тоже прокомментировано).
   */

  var PROGRAM_PAGE_ORDER = [
    'product-metrics', 'research', 'scenarios', 'ui-gaps',
    'screens', 'applications', 'interview'
  ];
  var PROGRAM_ANIM_DURATION = 0.5; // сек
  // Границы модулей в мобильной ленте (см. buildProgramFeedHTML) — первые 5
  // страниц по PROGRAM_PAGE_ORDER относятся к 1 модулю, "Подача и отклики"
  // и "Пройти проверку" — ко 2-му.
  var PROGRAM_MOB_MODULE_1_START = 'product-metrics';
  var PROGRAM_MOB_MODULE_2_START = 'applications';

  function initProgramPopup() {
    var popup = document.getElementById('popup-program');
    if (!popup) return;

    // Стартовая страница — сразу, без анимации (попап ещё не показан).
    setProgramPage(popup, popup.getAttribute('data-program-page') || PROGRAM_PAGE_ORDER[0], false);

    // Карточки на главной странице открывают popup-program через обычный
    // data-popup-open (см. initPopups); здесь только подставляем нужную
    // страницу ДО открытия, чтобы попап не мигал контентом другой карточки.
    document.querySelectorAll('[data-popup-open="popup-program"][data-program-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setProgramPage(popup, btn.getAttribute('data-program-page'), false);
      });
    });

    popup.querySelectorAll('[data-program-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = popup.getAttribute('data-program-page') || PROGRAM_PAGE_ORDER[0];
        var next = PROGRAM_PAGE_ORDER[(PROGRAM_PAGE_ORDER.indexOf(current) + 1) % PROGRAM_PAGE_ORDER.length];
        setProgramPage(popup, next, true, 'next');
      });
    });

    popup.querySelectorAll('[data-program-prev]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = popup.getAttribute('data-program-page') || PROGRAM_PAGE_ORDER[0];
        var idx = PROGRAM_PAGE_ORDER.indexOf(current);
        var prev = PROGRAM_PAGE_ORDER[(idx - 1 + PROGRAM_PAGE_ORDER.length) % PROGRAM_PAGE_ORDER.length];
        setProgramPage(popup, prev, true, 'prev');
      });
    });
  }

  function getProgramPageData(pageKey) {
    var tpl = document.querySelector('template[data-program-page="' + pageKey + '"]');
    if (!tpl) return null;
    var frag = tpl.content;
    return {
      badge: (frag.querySelector('[data-role="badge"]').textContent || '').trim(),
      title: (frag.querySelector('[data-role="title"]').textContent || '').trim(),
      desc: (frag.querySelector('[data-role="desc"]').textContent || '').trim(),
      cardsHTML: frag.querySelector('[data-role="cards"]').innerHTML
    };
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function isProgramMobLayout() {
    return window.matchMedia('(max-width: 479px)').matches;
  }

  // На мобилке (≤479px) "дальше" скрыта (см. CSS), навигация — скроллом: все
  // 7 страниц рендерятся подряд ОДНИМ фиксированным порядком (PROGRAM_PAGE_ORDER,
  // без круговых сдвигов — так карточка, на которую нажали, всегда стоит на
  // своём настоящем месте в потоке, а не "прыгает" наверх). Какая именно
  // страница открыта — не влияет на HTML, только на то, до какого раздела
  // проскроллит setProgramPage сразу после рендера (см. ниже, по
  // data-program-page на каждом .popup_program_mob_section).
  function buildProgramFeedHTML() {
    var html = '';
    for (var i = 0; i < PROGRAM_PAGE_ORDER.length; i++) {
      var pageKey = PROGRAM_PAGE_ORDER[i];
      var pageData = getProgramPageData(pageKey);
      if (!pageData) continue;
      var moduleLabel = '';
      if (pageKey === PROGRAM_MOB_MODULE_1_START) {
        moduleLabel = '<div class="text_30_px black popup_program_mob_module_label">1 модуль</div>';
      } else if (pageKey === PROGRAM_MOB_MODULE_2_START) {
        moduleLabel = '<div class="text_30_px black popup_program_mob_module_label">2 модуль</div>';
      }
      html +=
        '<div class="popup_program_mob_section" data-program-page="' + pageKey + '">' +
        moduleLabel +
        '<div class="program_week_wrapper-2 mb-20 ml-8"><div class="text_week size-12">' + escapeHtml(pageData.badge) + '</div></div>' +
        '<div class="popup_text_program_wrapper mb-847 ml-8"><div class="text_48_px color-black">' + escapeHtml(pageData.title) + '</div><div class="text_small text_aligh-left width-445">' + escapeHtml(pageData.desc) + '</div></div>' +
        '<div class="w-layout-grid popup_program_grid_mob">' + pageData.cardsHTML + '</div>' +
        '</div>';
    }
    return html;
  }

  // direction: 'next' (по умолчанию) — старое уезжает вверх, новое въезжает
  // снизу; 'prev' — зеркально (старое вниз, новое сверху), чтобы "назад"
  // визуально ехал в обратную сторону от "дальше".
  function setProgramPage(popup, pageKey, animate, direction) {
    var data = getProgramPageData(pageKey);
    if (!data) return;

    var leftBoundary = popup.querySelector('.popup_program_page_left');
    var cardsMobBoundary = popup.querySelector('.popup_left_side_program-copy .popup_program_page_cards');
    var cardsDesktopBoundary = popup.querySelector('.popup_right_side_program .popup_program_page_cards');

    if (isProgramMobLayout()) {
      // Лента, не одна страница — карточная сетка внутри .popup_program_page_cards
      // (общий "одна страница" грид) тут не используется, у каждого раздела
      // ленты свой собственный грид (см. buildProgramFeedHTML), поэтому этот
      // контейнер оставляем пустым — сворачивается в 0 высоты, места не занимает.
      // .popup_program_grid (десктопный) заполняем на случай ресайза в десктоп.
      popup.setAttribute('data-program-page', pageKey);
      var leftInner = leftBoundary.querySelector('.popup_program_page_left_inner');
      leftInner.innerHTML = buildProgramFeedHTML();
      cardsMobBoundary.querySelector('.popup_program_grid_mob').innerHTML = '';
      cardsDesktopBoundary.querySelector('.popup_program_grid').innerHTML = data.cardsHTML;

      // Порядок в ленте всегда фиксированный (карточка стоит на своём
      // настоящем месте, не наверху) — вместо этого сразу после рендера
      // доскролливаем лист до раздела нажатой карточки, дальше
      // пользователь листает сам.
      var targetSection = leftInner.querySelector('.popup_program_mob_section[data-program-page="' + pageKey + '"]');
      if (targetSection) targetSection.scrollIntoView({ block: 'start', behavior: 'auto' });
      return;
    }

    var buildLeftHTML = function () {
      return '<div class="program_week_wrapper-2 mb-20 ml-8"><div class="text_week size-12">' + escapeHtml(data.badge) + '</div></div>' +
        '<div class="popup_text_program_wrapper mb-847 ml-8"><div class="text_48_px color-black">' + escapeHtml(data.title) + '</div><div class="text_small text_aligh-left width-445">' + escapeHtml(data.desc) + '</div></div>';
    };
    var buildCardsHTML = function () {
      return data.cardsHTML;
    };

    if (!animate) {
      popup.setAttribute('data-program-page', pageKey);
      leftBoundary.querySelector('.popup_program_page_left_inner').innerHTML = buildLeftHTML();
      cardsMobBoundary.querySelector('.popup_program_grid_mob').innerHTML = data.cardsHTML;
      cardsDesktopBoundary.querySelector('.popup_program_grid').innerHTML = data.cardsHTML;
      return;
    }

    // Защита от повторного клика по "дальше", пока текущая анимация не
    // доиграла — иначе клоны для снимка "старого" контента могут
    // накопиться друг на друге.
    if (popup.dataset.programBusy === '1') return;

    if (typeof window.gsap === 'undefined') {
      // Без GSAP анимации на сайте нет нигде (см. playSlideAnimation
      // выше) — тот же принцип: страница просто меняется мгновенно.
      popup.setAttribute('data-program-page', pageKey);
      leftBoundary.querySelector('.popup_program_page_left_inner').innerHTML = buildLeftHTML();
      cardsMobBoundary.querySelector('.popup_program_grid_mob').innerHTML = data.cardsHTML;
      cardsDesktopBoundary.querySelector('.popup_program_grid').innerHTML = data.cardsHTML;
      return;
    }

    popup.dataset.programBusy = '1';
    popup.setAttribute('data-program-page', pageKey);

    var cleanups = [];
    var master = window.gsap.timeline({
      defaults: { duration: PROGRAM_ANIM_DURATION, ease: 'power2.inOut' },
      onComplete: function () {
        cleanups.forEach(function (fn) { fn(); });
        popup.dataset.programBusy = '';
      }
    });

    queueProgramSwap(master, cleanups, leftBoundary, '.popup_program_page_left_inner', buildLeftHTML, direction);
    queueProgramSwap(master, cleanups, cardsMobBoundary, '.popup_program_grid_mob', buildCardsHTML, direction);
    queueProgramSwap(master, cleanups, cardsDesktopBoundary, '.popup_program_grid', buildCardsHTML, direction);
  }

  // Добавляет в общий timeline анимацию одного блока: снимок текущего
  // содержимого (oldClone) уезжает в одну сторону, новое содержимое (уже
  // отрендеренное в inner) въезжает с противоположной — направление зависит
  // от direction ('next': старое вверх, новое снизу; 'prev': зеркально).
  //
  // Высота границы (boundaryEl) НЕ анимируется — раньше она тянулась
  // отдельным твинном от oldHeight к newHeight одновременно со сдвигом, и
  // эти два движения ехали не совсем синхронно (разный эффективный "путь"
  // при разнице высот) — из-за этого подрезка overflow:hidden моргала, и
  // анимация выглядела дёргано, особенно у "назад". Вместо этого высота
  // сразу (без анимации) выставляется в max(oldHeight, newHeight) — это
  // просто пустая область в цвет фона (см. ниже), её не видно — и едет
  // только сам контент, ровно и одинаково для "дальше"/"назад"/карточек.
  // После анимации cleanups снимают инлайн-height, обёртка сама садится на
  // естественную (новую) высоту — незаметно, там всё равно был пустой фон.
  //
  // У старой и новой страницы почти всегда разная высота (заголовок и
  // описание — разной длины), поэтому пока оба слоя едут, они на
  // мгновение перекрываются по вертикали — это нормально для "конвейера".
  // Раньше это перекрытие было заметно текстом-сквозь-текст: у бейджа/
  // заголовка/описания нет непрозрачного фона. Красим оба слоя в цвет
  // листа (var(--white)) на время анимации и кладём старый слой ВЫШЕ
  // нового (z-index) — тогда в зоне перекрытия виден только один слой. У
  // карточек то же самое перекрытие есть, но не было заметно — у каждой
  // карточки уже был свой непрозрачный фон; красим и их для единообразия и
  // на случай будущих карточек без фонового изображения.
  function queueProgramSwap(master, cleanups, boundaryEl, innerSelector, buildInnerHTML, direction) {
    var gsap = window.gsap;
    var inner = boundaryEl.querySelector(innerSelector);
    if (!inner) return;

    var oldHeight = inner.offsetHeight;
    var oldClone = inner.cloneNode(true);
    boundaryEl.appendChild(oldClone);

    inner.innerHTML = buildInnerHTML();
    var newHeight = inner.scrollHeight;
    var travel = Math.max(oldHeight, newHeight);

    // 'prev' — зеркально: старое уезжает вниз, новое въезжает сверху (было
    // наоборот у "дальше"). Считаем сдвиг в пикселях (y), а не в yPercent —
    // yPercent берёт проценты от высоты СВОЕГО ЖЕ элемента, а у старого и
    // нового блока высоты почти всегда разные (заголовок/описание/число
    // карточек отличаются). Из-за этого слои ехали с разной скоростью и в
    // середине анимации реально пересекались в одних и тех же пикселях —
    // это и было "наслоение", отдельно от прозрачности фона (её уже
    // чинили). Когда оба слоя едут на одно и то же расстояние (travel —
    // высота большего из них), старый всегда успевает полностью уйти
    // ровно к тому моменту, когда новый его сменяет — наложиться им негде.
    var oldExit = direction === 'prev' ? travel : -travel;
    var newEnter = direction === 'prev' ? -travel : travel;

    gsap.set(boundaryEl, { height: travel });
    gsap.set(oldClone, {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
      backgroundColor: 'var(--white)'
    });
    gsap.set(inner, {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1, y: newEnter,
      backgroundColor: 'var(--white)'
    });

    master.to(oldClone, { y: oldExit }, 0);
    master.to(inner, { y: 0 }, 0);

    cleanups.push(function () {
      oldClone.remove();
      gsap.set(boundaryEl, { clearProps: 'height' });
      gsap.set(inner, { clearProps: 'position,top,left,right,y,zIndex,backgroundColor' });
    });
  }

  // Переворот карточек попапа "Программа" (.popup_program_cart_wrapper) на
  // hover-устройствах — чистый CSS (:hover в fff-9072af.webflow.css). На
  // устройствах без мыши (hover: none — тачскрины) hover не работает,
  // поэтому там переворот по тапу: класс .is-flipped переключается кликом
  // (тот же клик, что браузер генерирует по тапу). Первый тап — на
  // обратную сторону, второй — обратно. Слушатель — на document с
  // делегированием, а не на самих карточках: они перерисовываются заново
  // при каждой смене страницы попапа (setProgramPage), прямой обработчик
  // на конкретных узлах пережил бы только до следующего рендера.
  function initProgramCardFlipTaps() {
    if (!window.matchMedia('(hover: none)').matches) return;
    document.addEventListener('click', function (event) {
      var card = event.target.closest('.popup_program_cart_wrapper');
      if (!card) return;
      var wasFlipped = card.classList.contains('is-flipped');
      // Одновременно на бэк-стороне может быть только одна карточка —
      // при тапе на любую другую сначала возвращаем на фронт все
      // остальные перевёрнутые (в любом попапе/гриде на странице).
      document.querySelectorAll('.popup_program_cart_wrapper.is-flipped').forEach(function (flipped) {
        if (flipped !== card) flipped.classList.remove('is-flipped');
      });
      card.classList.toggle('is-flipped', !wasFlipped);
    });
  }

  // popup-nav-mob: панель докована сверху и въезжает/уезжает по Y (см.
  // playSlideAnimation, data-popup-slide-from="top"). Ручка .popup_line-copy
  // рядом с ней — можно потянуть вверх, чтобы закрыть попап перетаскиванием,
  // а не только кнопкой "закрываем"/Escape. Работает независимо от
  // playSlideAnimation (та отвечает только за open/close целиком), но
  // использует те же yPercent/y и offscreenYPercent=-100, чтобы drag и
  // авто-анимация закрытия не дёргались друг относительно друга в момент
  // передачи (closePopup подхватывает textPercent/y с той точки, где палец
  // отпустили — GSAP .to всегда анимирует от текущего значения).
  function initNavMobDrag() {
    if (typeof window.gsap === 'undefined') return;
    var gsap = window.gsap;
    var popup = document.getElementById('popup-nav-mob');
    if (!popup) return;
    var handle = popup.querySelector('.popup_line-copy');
    var sheet = popup.querySelector('.popup_mob_bg');
    if (!handle || !sheet) return;

    var DISMISS_RATIO = 0.3; // доля высоты панели — после неё отпускание закрывает попап

    var dragging = false;
    var startY = 0;
    var dy = 0;
    var travel = 0;

    function onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (!isOpen(popup)) return;
      gsap.killTweensOf([handle, sheet]);
      travel = sheet.offsetHeight || 300;
      dragging = true;
      startY = e.clientY;
      dy = 0;
      if (handle.setPointerCapture) {
        try { handle.setPointerCapture(e.pointerId); } catch (err) {}
      }
    }

    function onPointerMove(e) {
      if (!dragging) return;
      dy = Math.min(e.clientY - startY, 0); // тянуть можно только вверх — вниз некуда, панель докована к верху
      var progress = Math.min(-dy / travel, 1);
      gsap.set(sheet, { yPercent: -100 * progress });
      gsap.set(handle, { y: -travel * progress });
    }

    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      var progress = Math.min(-dy / travel, 1);
      if (progress > DISMISS_RATIO) {
        closePopup(popup);
      } else {
        gsap.to(sheet, { yPercent: 0, duration: 0.3, ease: 'power2.out' });
        gsap.to(handle, { y: 0, duration: 0.3, ease: 'power2.out' });
      }
    }

    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', onPointerUp);
    handle.addEventListener('pointercancel', onPointerUp);
    // Иначе на тач-устройствах жест по ручке частично перехватывается
    // браузером (pull-to-refresh и т.п.) вместо onPointerMove.
    handle.style.touchAction = 'none';
  }

  initDropdowns();
  initPopups();
  initProgramPopup();
  initProgramCardFlipTaps();
  initNavMobDrag();
})();
