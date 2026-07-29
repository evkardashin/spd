(function () {
  'use strict';

  // Свайпер для support_cart_wrapper _1/_2/_3 — только мобилка (≤479px),
  // десктопный "веер" на hover (см. <style> рядом с разметкой карточек в
  // index.html) не трогаем вообще.
  if (typeof window.gsap === 'undefined') return;

  var gsap = window.gsap;
  var wrapper = document.querySelector('.support_carts_wrapper.mb-85');
  if (!wrapper) return;

  var card1 = wrapper.querySelector('.support_cart_wrapper._1');
  var card2 = wrapper.querySelector('.support_cart_wrapper._2');
  var card3 = wrapper.querySelector('.support_cart_wrapper._3');
  if (!card1 || !card2 || !card3) return;

  var mm = gsap.matchMedia();

  mm.add('(max-width: 479px)', function () {
    return setup();
  });

  function setup() {
    // Роли-слоты: left/center/right. По умолчанию — ровно тот "веер", что уже
    // рисует CSS (_1 в центре крупная, _2 справа выглядывает, _3 слева).
    var order = [card3, card1, card2];
    var natural = null; // Map<el, {cx,cy,w,h}> — натуральная (нетрансформированная) геометрия
    var slots = null; // [leftSlot, centerSlot, rightSlot] — фиксированные целевые точки
    var zBySlot = [1, 3, 2];

    // Меряем лениво, при первом касании: program-animation.js ещё до этого
    // анимирует эти же карточки (opacity/y/scale при появлении в вьюпорте) и
    // снимает свой transform через clearProps — если измерить раньше, можно
    // поймать карточку в процессе её собственного появления.
    function ensureMeasured() {
      if (natural) return;
      natural = new Map();
      [card1, card2, card3].forEach(function (el) {
        var r = el.getBoundingClientRect();
        natural.set(el, { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width });
      });
      slots = [natural.get(card3), natural.get(card1), natural.get(card2)];
    }

    function targetFor(el, slotIndex) {
      var n = natural.get(el);
      var s = slots[slotIndex];
      return { x: s.cx - n.cx, y: s.cy - n.cy, scale: s.w / n.w };
    }

    function applyOrder(animate, extraX) {
      order.forEach(function (el, i) {
        var t = targetFor(el, i);
        var x = t.x + (extraX || 0);
        gsap.set(el, { zIndex: zBySlot[i] });
        if (animate) {
          gsap.to(el, { x: x, y: t.y, scale: t.scale, duration: 0.5, ease: 'back.out(1.4)' });
        } else {
          gsap.set(el, { x: x, y: t.y, scale: t.scale });
        }
      });
    }

    var dragging = false;
    var startX = 0;
    var dx = 0;
    var THRESHOLD = 50;

    function onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      ensureMeasured();
      applyOrder(false);
      dragging = true;
      startX = e.clientX;
      dx = 0;
      if (wrapper.setPointerCapture) {
        try { wrapper.setPointerCapture(e.pointerId); } catch (err) {}
      }
    }

    function onPointerMove(e) {
      if (!dragging) return;
      dx = e.clientX - startX;
      applyOrder(false, dx);
    }

    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      if (dx <= -THRESHOLD) {
        order = [order[1], order[2], order[0]]; // свайп влево — вперёд
      } else if (dx >= THRESHOLD) {
        order = [order[2], order[0], order[1]]; // свайп вправо — назад
      }
      applyOrder(true);
    }

    wrapper.addEventListener('pointerdown', onPointerDown);
    wrapper.addEventListener('pointermove', onPointerMove);
    wrapper.addEventListener('pointerup', onPointerUp);
    wrapper.addEventListener('pointercancel', onPointerUp);
    var prevTouchAction = wrapper.style.touchAction;
    wrapper.style.touchAction = 'pan-y';

    return function cleanup() {
      wrapper.removeEventListener('pointerdown', onPointerDown);
      wrapper.removeEventListener('pointermove', onPointerMove);
      wrapper.removeEventListener('pointerup', onPointerUp);
      wrapper.removeEventListener('pointercancel', onPointerUp);
      wrapper.style.touchAction = prevTouchAction;
      gsap.set([card1, card2, card3], { clearProps: 'transform,zIndex' });
    };
  }
})();
