(function () {
  'use strict';

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
