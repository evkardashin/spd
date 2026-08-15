(function () {
  'use strict';

  // "Обложечный" (coverflow-like) свайпер для .rate_carts_wrapper — только
  // мобилка (≤479px), десктоп/планшет не трогаем. Полная копия логики
  // js/consultation-cover-swiper.js (см. подробные комментарии там) —
  // заменяет собой старый Swiper.js-свайпер (js/carts-swiper.js, больше не
  // подключается) той же карусели.
  if (typeof window.gsap === 'undefined') return;

  var gsap = window.gsap;
  var wrapper = document.querySelector('.rate_carts_wrapper');
  if (!wrapper) return;

  var cards = Array.prototype.slice.call(wrapper.querySelectorAll('.rate_cart_wrapper'));
  if (cards.length < 3) return;

  var mm = gsap.matchMedia();

  mm.add('(max-width: 479px)', function () {
    return setup();
  });

  function setup() {
    var activeIndex = 2; // _3 — активная карточка по умолчанию
    var measured = false;
    var stepNear = 0; // смещение от центра до соседней (offset ±1) карточки
    var stepFar = 0; // доп. шаг до карточки через одну (offset ±2)
    var prevWrapperPosition = '';
    var prevWrapperHeight = '';

    var ROTATE_LEFT = 22; // угол поворота левой соседней (offset -1) карточки
    var ROTATE_RIGHT = 32; // угол поворота правой соседней (offset +1) карточки
    var SCALE_NEAR = 0.87; // масштаб соседней карточки
    var SCALE_FAR = 0.7; // масштаб карточек через одну (offset ±2 и дальше)
    var GAP_REM = 0.5; // зазор между краями соседних карточек (с учётом их scale)

    // Все карточки становятся position:absolute и садятся в ОДНУ и ту же точку
    // — центр .rate_carts_wrapper. Точку отсчёта считаем сами через
    // getBoundingClientRect (числа в JS), а не через CSS left:50% — см.
    // подробности в js/consultation-cover-swiper.js. left:0 + свой центр в
    // пикселях убирают асимметрию, поэтому padding-left у .rate_carts_wrapper
    // на мобилке тоже обнулён в CSS (см. fff-9072af.webflow.css).
    var cardWidth = 0;

    function ensureMeasured() {
      if (measured) return;
      measured = true;

      var rect = cards[0].getBoundingClientRect();
      cardWidth = rect.width;
      var gapPx = GAP_REM * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);

      stepNear = cardWidth / 2 + gapPx + (cardWidth * SCALE_NEAR) / 2;
      stepFar = (cardWidth * SCALE_NEAR) / 2 + gapPx + (cardWidth * SCALE_FAR) / 2;

      prevWrapperPosition = wrapper.style.position;
      prevWrapperHeight = wrapper.style.height;
      wrapper.style.position = 'relative';
      wrapper.style.height = rect.height + 'px';

      gsap.set(cards, {
        position: 'absolute',
        top: '50%',
        left: 0,
        yPercent: -50,
        transformPerspective: 1000,
        transformOrigin: 'center center'
      });
    }

    // Кольцевое смещение карточки i от активной — так же, как rewind у Swiper:
    // после последней карточки соседом снова становится первая.
    function offsetOf(i) {
      var n = cards.length;
      var raw = i - activeIndex;
      if (raw > n / 2) raw -= n;
      if (raw < -n / 2) raw += n;
      return raw;
    }

    function targetFor(offset) {
      var abs = Math.abs(offset);
      if (abs === 0) return { pos: 0, rotate: 0, scale: 1, opacity: 1, z: 3 };
      if (abs === 1) {
        // Угол слева и справа задан раздельно — одинаковый по модулю угол
        // для обеих сторон визуально выглядит несимметрично из-за перспективы.
        return { pos: offset > 0 ? stepNear : -stepNear, rotate: offset > 0 ? -ROTATE_RIGHT : ROTATE_LEFT, scale: SCALE_NEAR, opacity: 1, z: 2 };
      }
      // Дальние карточки прячем — при 5 карточках в кольце видимыми должны
      // быть только активная и её непосредственные соседи слева/справа.
      // opacity:0, поэтому угол здесь не виден — оставлен симметричным.
      var pos = stepNear + stepFar * (abs - 1);
      return { pos: offset > 0 ? pos : -pos, rotate: offset > 0 ? -(ROTATE_RIGHT + 8) : (ROTATE_LEFT + 8), scale: SCALE_FAR, opacity: 0, z: 1 };
    }

    function applyPositions(animate, extraX) {
      ensureMeasured();
      var center = wrapper.getBoundingClientRect().width / 2 - cardWidth / 2;

      cards.forEach(function (el, i) {
        var t = targetFor(offsetOf(i));
        var props = {
          x: center + t.pos + (extraX || 0),
          rotateY: t.rotate,
          scale: t.scale,
          opacity: t.opacity,
          zIndex: t.z
        };
        if (animate) {
          // Без перелёта (back.out) — см. комментарий в
          // js/consultation-cover-swiper.js про разный "перелёт" в пикселях.
          gsap.to(el, Object.assign({ duration: 0.4, ease: 'power2.out' }, props));
        } else {
          gsap.set(el, props);
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
      applyPositions(false);
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
      applyPositions(false, dx);
    }

    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      var n = cards.length;
      if (dx <= -THRESHOLD) {
        activeIndex = (activeIndex + 1) % n; // свайп влево — вперёд
      } else if (dx >= THRESHOLD) {
        activeIndex = (activeIndex - 1 + n) % n; // свайп вправо — назад
      }
      applyPositions(true);
    }

    wrapper.addEventListener('pointerdown', onPointerDown);
    wrapper.addEventListener('pointermove', onPointerMove);
    wrapper.addEventListener('pointerup', onPointerUp);
    wrapper.addEventListener('pointercancel', onPointerUp);
    var prevTouchAction = wrapper.style.touchAction;
    wrapper.style.touchAction = 'pan-y';

    // Начальное состояние — сразу видно активную карточку по центру, без
    // ожидания первого касания.
    ensureMeasured();
    applyPositions(false);

    return function cleanup() {
      wrapper.removeEventListener('pointerdown', onPointerDown);
      wrapper.removeEventListener('pointermove', onPointerMove);
      wrapper.removeEventListener('pointerup', onPointerUp);
      wrapper.removeEventListener('pointercancel', onPointerUp);
      wrapper.style.touchAction = prevTouchAction;
      wrapper.style.position = prevWrapperPosition;
      wrapper.style.height = prevWrapperHeight;
      gsap.set(cards, { clearProps: 'transform,opacity,zIndex,position,top,left' });
      measured = false;
    };
  }
})();
