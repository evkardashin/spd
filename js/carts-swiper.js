(function () {
  'use strict';

  // rate_carts_wrapper — обычный Swiper-свайп, только мобилка (≤479px),
  // десктоп/планшет не трогаем (.carts_swiper_track там display:contents, см.
  // css/fff-9072af.webflow.css). rewind:true — долистав до последней карточки,
  // свайп продолжает крутить назад к первой, а не просто упирается в край.
  //
  // consultation_carts_wrapper.mb-20 сюда больше не входит — у неё свой
  // "обложечный" (coverflow-like) свайпер на чистом GSAP+Pointer Events, без
  // Swiper: см. js/consultation-cover-swiper.js. Причина переезда — встроенный
  // effect:'coverflow' Swiper (и попытка сделать то же вручную через события
  // Swiper 'progress'/slide.progress) не давала видимого эффекта в этой связке
  // несколько попыток подряд, а ручной GSAP-вариант по образцу
  // js/support-swiper.js уже проверенно работает на этом сайте.
  if (typeof window.Swiper === 'undefined') return;

  var container = document.querySelector('.rate_carts_wrapper');
  var mq = window.matchMedia('(max-width: 479px)');
  var instance = null;

  function initAll() {
    if (instance) return;
    var track = container && container.querySelector('.carts_swiper_track');
    if (!track) return;

    // spaceBetween Swiper принимает в пикселях, а исходный зазор — 0.5rem;
    // берём актуальный размер rem, чтобы не разъезжаться с плавающей (vw-based)
    // типографикой сайта на этом брейкпоинте.
    var rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    instance = new window.Swiper(container, {
      wrapperClass: 'carts_swiper_track',
      slideClass: 'rate_cart_wrapper',
      slidesPerView: 'auto',
      spaceBetween: rootPx * 0.5,
      rewind: true,
      grabCursor: true,
      observer: true,
      observeParents: true
    });
  }

  function destroyAll() {
    if (!instance) return;
    instance.destroy(true, true);
    instance = null;
  }

  function onChange() {
    if (mq.matches) initAll(); else destroyAll();
  }

  onChange();
  if (mq.addEventListener) {
    mq.addEventListener('change', onChange);
  } else if (mq.addListener) {
    mq.addListener(onChange);
  }
})();
