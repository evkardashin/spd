(function () {
  'use strict';

  // Ultimate safety net: whatever happens, never leave the hero permanently hidden.
  var safetyTimer = setTimeout(function () {
    if (window.__heroReveal) window.__heroReveal();
  }, 4000);

  function done() {
    clearTimeout(safetyTimer);
    if (window.__heroReveal) window.__heroReveal();
  }

  if (typeof window.gsap === 'undefined') {
    done();
    return;
  }

  try {
    var gsap = window.gsap;
    var hero = document.querySelector('.hero_section');
    if (!hero) { done(); return; }

    var heading = hero.querySelectorAll('[data-hero-el="heading"]');
    var cta = hero.querySelector('[data-hero-el="cta"]');
    var caption = hero.querySelector('[data-hero-el="caption"]');
    var logos = hero.querySelectorAll('[data-hero-el="logo"]');
    var desktopImg = hero.querySelector('[data-hero-el="desktop-img"]');
    var mobImg1 = hero.querySelector('[data-hero-el="mob-img-1"]');
    var mobImg2 = hero.querySelector('[data-hero-el="mob-img-2"]');
    var mobImg3 = hero.querySelector('[data-hero-el="mob-img-3"]');
    var mobCta = hero.querySelector('[data-hero-el="mob-cta"]');

    // The mobile cards clip their corners via the inner <img>/<video>, not the
    // positioned wrapper (the wrapper has no overflow:hidden), so the corner
    // radius has to be animated on that inner element for it to be visible.
    var mobMedia1 = mobImg1 && mobImg1.querySelector('img, video');
    var mobMedia2 = mobImg2 && mobImg2.querySelector('img, video');
    var mobMedia3 = mobImg3 && mobImg3.querySelector('img, video');

    var mm = gsap.matchMedia();

    mm.add(
      { isMobile: '(max-width: 479px)', isDesktop: '(min-width: 480px)' },
      function (context) {
        var isMobile = context.conditions.isMobile;
        var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: done });

        gsap.set(heading, { opacity: 0, y: 28 });
        if (cta) gsap.set(cta, { opacity: 0, y: 22, scale: 0.88, rotate: -4 });
        if (caption) gsap.set(caption, { opacity: 0, y: 16 });
        gsap.set(logos, { opacity: 0, y: 14 });

        if (isMobile) {
          if (mobImg1) gsap.set(mobImg1, { opacity: 0, x: 46, y: -56, rotate: -34, scale: 0.75 });
          if (mobImg2) gsap.set(mobImg2, { opacity: 0, x: 40, y: -34, rotate: -24, scale: 0.75 });
          if (mobImg3) gsap.set(mobImg3, { opacity: 0, x: 30, y: 30, rotate: 36, scale: 0.75 });
          if (mobMedia1) gsap.set(mobMedia1, { borderRadius: '46%' });
          if (mobMedia2) gsap.set(mobMedia2, { borderRadius: '46%' });
          if (mobMedia3) gsap.set(mobMedia3, { borderRadius: '46%' });
          if (mobCta) gsap.set(mobCta, { opacity: 0, y: 20 });
        } else if (desktopImg) {
          gsap.set(desktopImg, { opacity: 0, y: 36, scale: 0.92, rotate: -5, borderRadius: '40%' });
        }

        tl.to(heading, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 });

        if (cta) {
          tl.to(cta, { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 0.75, ease: 'back.out(2.2)' }, '-=0.45');
        }
        if (caption) {
          tl.to(caption, { opacity: 1, y: 0, duration: 0.5 }, '-=0.4');
        }
        if (logos.length) {
          tl.to(logos, { opacity: 1, y: 0, duration: 0.5, stagger: 0.04 }, '-=0.3');
        }

        if (isMobile) {
          var mobEase = 'back.out(1.7)';
          var radiusEase = 'power2.out';
          if (mobImg1) tl.to(mobImg1, { opacity: 1, x: 0, y: 0, rotate: -8.506, scale: 1, duration: 0.9, ease: mobEase }, '-=0.25');
          if (mobMedia1) tl.to(mobMedia1, { borderRadius: '24px', duration: 0.9, ease: radiusEase }, '<');
          if (mobImg2) tl.to(mobImg2, { opacity: 1, x: 0, y: 0, rotate: -2.241, scale: 1, duration: 0.9, ease: mobEase }, '-=0.75');
          if (mobMedia2) tl.to(mobMedia2, { borderRadius: '24px', duration: 0.9, ease: radiusEase }, '<');
          if (mobImg3) tl.to(mobImg3, { opacity: 1, x: 0, y: 0, rotate: 10.201, scale: 1, duration: 0.9, ease: mobEase }, '-=0.75');
          if (mobMedia3) tl.to(mobMedia3, { borderRadius: '24px', duration: 0.9, ease: radiusEase }, '<');
          if (mobCta) tl.to(mobCta, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');
        } else if (desktopImg) {
          // border-radius анимируется отдельным твином с плавным ease: у back.out есть
          // перелёт (значение уходит за целевое и возвращается), а перелёт по border-radius
          // утягивает его к 0 — угол на мгновение становится острым. Байнс оставляем только
          // на transform/opacity, скругление просто плавно доезжает до 24px.
          tl.to(desktopImg, { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 1, ease: 'back.out(1.6)' }, '-=0.55');
          tl.to(desktopImg, { borderRadius: '24px', duration: 1, ease: 'power2.out' }, '<');
        }

        return function cleanup() {
          tl.kill();
        };
      }
    );
  } catch (err) {
    done();
  }
})();
