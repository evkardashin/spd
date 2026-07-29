(function () {
  'use strict';

  // Бегущая строка партнёров (мобилка, ≤479px) — чистый CSS @keyframes, GSAP не
  // нужен. Единственная задача JS здесь — экономить батарею: ставить анимацию
  // на паузу, пока .partners_track_group вне вьюпорта (попап поверх, секция
  // проскроллена мимо). На десктопе/планшете элемент display:contents — его
  // не видно и наблюдать не за чем, IntersectionObserver туда просто не дойдёт.
  if (typeof window.IntersectionObserver === 'undefined') return;

  var group = document.querySelector('.partners_track_group');
  if (!group) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      group.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
    });
  }, { threshold: 0 });

  observer.observe(group);
})();
