(function () {
  'use strict';

  if (!window.matchMedia || !window.IntersectionObserver) return;

  var SCENE_TILT = 5;
  var SCENE_PERSPECTIVE = 1400;
  var ICON_TILT = 24;
  var ICON_PERSPECTIVE = 260;
  // Критически затухающая пружина: разгон и остановка без скачка скорости.
  var SPRING = 7;

  var pointerMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
  var motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  var items = [];
  var pointer = { x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0 };
  var enabled = false;
  var frame = 0;
  var lastTime = 0;

  // Сцена наклоняется целиком, как в Atropos, а слои внутри неё сдвигаются по глубине.
  document.querySelectorAll('[data-parallax-scene]').forEach(function (element) {
    items.push({
      element: element, layer: element, scene: true,
      tilt: Number(element.dataset.parallaxScene) || SCENE_TILT,
      visible: false
    });
  });

  document.querySelectorAll('[data-parallax]').forEach(function (element) {
    // Для целых карточек двигаем translate отдельно от GSAP-transform:
    // фон, текст и изображение остаются вместе, структура flex не меняется.
    var moveSelf = element.hasAttribute('data-parallax-self');
    var layer = element;
    if (!moveSelf) {
      layer = document.createElement('div');
      layer.className = 'pointer_parallax_layer';
      while (element.firstChild) layer.appendChild(element.firstChild);
      element.appendChild(layer);
    }

    items.push({
      element: element, layer: layer, moveSelf: moveSelf,
      originalTranslate: element.style.translate || '',
      depth: Math.max(-30, Math.min(30, Number(element.dataset.parallax) || 0)),
      // Широким заголовкам нужен мягкий наклон сцены, а не сильный поворот иконки.
      tilt: Number(element.dataset.parallaxTilt) || ICON_TILT,
      perspective: element.dataset.parallaxTilt ? SCENE_PERSPECTIVE : ICON_PERSPECTIVE,
      visible: false
    });
  });

  if (!items.length) return;

  function schedule() {
    if (enabled && !frame) frame = window.requestAnimationFrame(animate);
  }

  function render(item) {
    var x = pointer.x;
    var y = pointer.y;
    var rest = !x && !y;

    if (item.scene) {
      item.layer.style.transform = rest ? '' : 'perspective(' + SCENE_PERSPECTIVE + 'px)'
        + ' rotateX(' + (-y * item.tilt).toFixed(3) + 'deg)'
        + ' rotateY(' + (x * item.tilt).toFixed(3) + 'deg)';
      return;
    }

    var moveX = (x * item.depth).toFixed(2);
    var moveY = (y * item.depth * 0.65).toFixed(2);
    if (item.moveSelf) {
      item.layer.style.translate = rest ? item.originalTranslate : moveX + 'px ' + moveY + 'px';
    } else {
      item.layer.style.transform = rest ? '' : 'perspective(' + item.perspective + 'px)'
        + ' translate3d(' + moveX + 'px, ' + moveY + 'px, 0)'
        + ' rotateX(' + (-y * item.tilt).toFixed(3) + 'deg)'
        + ' rotateY(' + (x * item.tilt).toFixed(3) + 'deg)';
    }
  }

  function animate(time) {
    frame = 0;
    var delta = (lastTime ? Math.min(time - lastTime, 64) : 16) / 1000;
    lastTime = time;

    pointer.vx += (SPRING * SPRING * (pointer.targetX - pointer.x) - 2 * SPRING * pointer.vx) * delta;
    pointer.vy += (SPRING * SPRING * (pointer.targetY - pointer.y) - 2 * SPRING * pointer.vy) * delta;
    pointer.x += pointer.vx * delta;
    pointer.y += pointer.vy * delta;

    var moving = Math.abs(pointer.targetX - pointer.x) > 0.0005
      || Math.abs(pointer.targetY - pointer.y) > 0.0005
      || Math.abs(pointer.vx) > 0.005 || Math.abs(pointer.vy) > 0.005;
    if (!moving) {
      pointer.x = pointer.targetX;
      pointer.y = pointer.targetY;
      pointer.vx = pointer.vy = 0;
    }

    items.forEach(function (item) {
      if (item.visible) render(item);
    });

    if (moving) schedule();
    else lastTime = 0;
  }

  function returnToRest() {
    pointer.targetX = pointer.targetY = 0;
    schedule();
  }

  // Координаты относительно окна и один слушатель на страницу: скролл и переход
  // между секциями не сбрасывают положение, поэтому слои не дёргаются к центру.
  window.addEventListener('pointermove', function (event) {
    if (!enabled || (event.pointerType && event.pointerType !== 'mouse')) return;
    pointer.targetX = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1));
    pointer.targetY = Math.max(-1, Math.min(1, event.clientY / window.innerHeight * 2 - 1));
    schedule();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', returnToRest);

  var byElement = new Map();
  items.forEach(function (item) { byElement.set(item.element, item); });
  var observer = new window.IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var item = byElement.get(entry.target);
      item.visible = entry.isIntersecting;
      if (item.visible) render(item);
    });
  });

  function updateEnabled() {
    enabled = pointerMedia.matches && !motionMedia.matches && !document.hidden;
    if (enabled) {
      items.forEach(function (item) { observer.observe(item.element); });
    } else {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      frame = lastTime = 0;
      pointer.x = pointer.y = pointer.vx = pointer.vy = pointer.targetX = pointer.targetY = 0;
      items.forEach(function (item) {
        item.visible = false;
        render(item);
      });
    }
  }

  pointerMedia.addEventListener('change', updateEnabled);
  motionMedia.addEventListener('change', updateEnabled);
  document.addEventListener('visibilitychange', updateEnabled);
  window.addEventListener('blur', returnToRest);
  updateEnabled();
}());
