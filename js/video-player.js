(function () {
  'use strict';

  // Attach sources only when a visible video approaches the viewport. CSS-hidden
  // desktop/mobile variants must not compete with the page for bandwidth.
  var lazyVideos = document.querySelectorAll('[data-lazy-video]');
  function startVideo(video) {
    if (!video.dataset.loaded) {
      video.querySelectorAll('source[data-src]').forEach(function (source) {
        source.src = source.dataset.src;
        source.removeAttribute('data-src');
      });
      video.dataset.loaded = 'true';
      video.load();
    }
    if (document.hidden) return;
    var playback = video.play();
    if (playback && playback.catch) playback.catch(function () {});
  }

  function updateVideos() {
    lazyVideos.forEach(function (video) {
      var rect = video.getBoundingClientRect();
      var visible = video.getClientRects().length && rect.width > 0 && rect.height > 0;
      if (visible && rect.bottom > -200 && rect.top < window.innerHeight + 200 && !document.hidden) {
        startVideo(video);
      } else {
        video.pause();
      }
    });
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(updateVideos, { rootMargin: '200px' });
    lazyVideos.forEach(function (video) { observer.observe(video); });
  } else {
    window.addEventListener('scroll', updateVideos, { passive: true });
  }
  window.addEventListener('resize', updateVideos);
  document.addEventListener('visibilitychange', updateVideos);
  updateVideos();

  document.querySelectorAll('[data-video-player]').forEach(function (player) {
    var video = player.querySelector('video');
    var button = player.querySelector('[data-video-sound]');
    if (!video || !button) return;

    function syncSound() {
      var soundOn = !video.muted && video.volume > 0;
      button.title = soundOn ? 'Выключить звук' : 'Включить звук';
      button.setAttribute('aria-pressed', String(soundOn));
    }

    video.addEventListener('volumechange', syncSound);
    video.addEventListener('error', function () {
      button.hidden = true;
      video.controls = true;
    });

    function toggleSound() {
      var soundOn = !video.muted && video.volume > 0;
      video.muted = soundOn;
      if (!soundOn && video.volume === 0) video.volume = 1;
      syncSound();

      if (!soundOn && video.paused) {
        var playback = video.play();
        if (playback && typeof playback.catch === 'function') {
          playback.catch(function () {
            video.muted = true;
            video.controls = true;
            syncSound();
          });
        }
      }
    }

    button.addEventListener('click', toggleSound);
    video.addEventListener('click', function () {
      // Не перехватываем нажатия на стандартные controls в запасном режиме.
      if (!video.controls) toggleSound();
    });

    syncSound();
    video.controls = false;
    button.hidden = false;
  });
}());
