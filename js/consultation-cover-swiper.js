(function () {
  'use strict';

  // "Обложечный" (coverflow-like) свайпер для consultation_carts_wrapper.mb-20 —
  // только мобилка (≤479px), десктоп не трогаем. Сделан по образцу
  // js/support-swiper.js (GSAP + Pointer Events, без библиотеки Swiper) —
  // тот вариант уже проверенно работает на сайте, в отличие от нескольких
  // попыток сделать то же через Swiper.js (см. комментарий в js/carts-swiper.js).
  if (typeof window.gsap === 'undefined') return;

  var gsap = window.gsap;
  var wrapper = document.querySelector('.consultation_carts_wrapper.mb-20');
  if (!wrapper) return;

  var cards = Array.prototype.slice.call(wrapper.querySelectorAll('.consultation_cart_wrapper'));
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

    var ROTATE = 32; // угол поворота по Y у соседней (offset ±1) карточки
    var SCALE_NEAR = 0.87; // масштаб соседней карточки
    var SCALE_FAR = 0.7; // масштаб карточек через одну (offset ±2 и дальше)
    var GAP_REM = 0.5; // зазор между краями соседних карточек (с учётом их scale)

    // Все карточки становятся position:absolute и садятся в ОДНУ и ту же точку
    // — центр .consultation_carts_wrapper.mb-20. Точку отсчёта считаем сами
    // через getBoundingClientRect (числа в JS), а не через CSS left:50% —
    // left:50% у position:absolute технически считается от padding box
    // контейнера, а у него padding-left:1rem при padding-right:0
    // (несимметричные паддинги), и это давало на глаз чуть больший зазор
    // с одной стороны. left:0 + xPercent:0 + свой центр в пикселях убирают
    // эту двусмысленность полностью.
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
        return { pos: offset > 0 ? stepNear : -stepNear, rotate: -offset * ROTATE, scale: SCALE_NEAR, opacity: 1, z: 2 };
      }
      // Дальние карточки прячем — при 5 карточках в кольце видимыми должны
      // быть только активная и её непосредственные соседи слева/справа.
      var pos = stepNear + stepFar * (abs - 1);
      return { pos: offset > 0 ? pos : -pos, rotate: -offset * (ROTATE + 8), scale: SCALE_FAR, opacity: 0, z: 1 };
    }

    function applyPositions(animate, extraX) {
      ensureMeasured();
      // Центр контейнера в пикселях, посчитан явно (см. комментарий в
      // ensureMeasured про left:50%/padding) — левый край карточки должен
      // встать в center - cardWidth/2, чтобы она сама оказалась по центру.
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
          // Без перелёта (back.out): у карточек разная дистанция до цели
          // (соседняя vs только что была дальней), при overshoot-easing это
          // на мгновение давало разный по величине "перелёт" в пикселях у
          // разных карточек — визуально как будто зазор слева/справа не
          // совпадает, хотя итоговые (settled) координаты симметричны.
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
