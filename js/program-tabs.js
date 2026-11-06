(function () {
  'use strict';

  var root = document.querySelector('[data-program-tabs]');
  if (!root) return;

  var list = root.querySelector('[role="tablist"]');
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));

  function getPanel(tab) {
    return document.getElementById(tab.getAttribute('aria-controls'));
  }

  function selectTab(tab) {
    tabs.forEach(function (item) {
      var isSelected = item === tab;
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      item.tabIndex = isSelected ? 0 : -1;
      getPanel(item).hidden = !isSelected;
    });

    getPanel(tab).scrollTop = 0;

    // На телефоне темы — горизонтальная лента: выбранную подводим к центру.
    list.scrollLeft = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      selectTab(tab);
    });

    tab.addEventListener('keydown', function (event) {
      var nextIndex;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      selectTab(tabs[nextIndex]);
      tabs[nextIndex].focus();
    });
  });

  // Картинки выше секции догружаются уже во время плавной прокрутки и сдвигают
  // её вниз, поэтому после перехода по якорю докручиваем до заголовка.
  var anchor = document.getElementById('program');
  document.querySelectorAll('a[href="#program"]').forEach(function (link) {
    link.addEventListener('click', function () {
      var margin = parseFloat(window.getComputedStyle(anchor).scrollMarginTop) || 0;
      if (Math.abs(anchor.getBoundingClientRect().top - margin) < 2) return;
      window.addEventListener('scrollend', function () {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, { once: true });
    });
  });
})();
