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
    toggle.classList.toggle('w--open', open);
    list.classList.toggle('w--open', open);
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
    // Исключение — popup-program и popup-testimonial на мобильной версии
    // (≤479px): там правая панель (.popup_right_side_program /
    // .popup_right_side) скрыта (см. CSS), и над листом снизу остаётся
    // настоящая пустая зона — клик по ней бьёт именно в .popup_content_wrapper,
    // а не в дочерний элемент, поэтому здесь клик снаружи однозначно отличим
    // от клика по контенту.
    ['popup-program', 'popup-testimonial'].forEach(function (id) {
      var wrapper = document.querySelector('#' + id + ' .popup_content_wrapper');
      if (!wrapper) return;
      wrapper.addEventListener('click', function (event) {
        if (event.target !== wrapper) return;
        if (!window.matchMedia('(max-width: 479px)').matches) return;
        closePopup(document.getElementById(id));
      });
    });

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

  initDropdowns();
  initPopups();
})();
