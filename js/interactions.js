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
      });
    });

    // Закрытие по клику мимо контента не реализовано намеренно: у попапов нет
    // отдельного элемента-подложки — .container занимает всю площадь попапа,
    // поэтому "клик снаружи" неотличим от клика по контенту. Закрытие — по
    // кнопке "закрыть"/"закрываем" (data-popup-close) и по Escape.
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
  }

  function closePopup(popup) {
    popup.style.display = 'none';
    if (!document.querySelector('[id^="popup"][style*="flex"]')) unlockScroll();
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
