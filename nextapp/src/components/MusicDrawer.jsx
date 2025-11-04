'use client';

import { useEffect } from 'react';

const VIDEOS = [
  { src: "/videos/nostoi.mp4", title: "Nostoi" },
  { src: "/videos/360.mp4", title: "360" },
  { src: "/videos/blowme.mp4", title: "Blow Me" },
  { src: "/videos/callaito.mp4", title: "Callaito" },
  { src: "/videos/jim.mp4", title: "Jim" },
  { src: "/videos/keef.mp4", title: "Keef" },
  { src: "/videos/marlo.mp4", title: "Marlo" },
  { src: "/videos/moneyspread.mp4", title: "Money Spread" },
  { src: "/videos/perrabb.mp4", title: "Perrabb" },
  { src: "/videos/sonrie.mp4", title: "Sonríe" },
  { src: "/videos/teniafe.mp4", title: "Tenía Fe" },
  { src: "/videos/toymb.mp4", title: "Toy MB" },
  { src: "/videos/yeat.mp4", title: "Yeat" }
];

export default function MusicDrawer() {
  useEffect(() => {
    try { window.PB_MUSIC_OWNER = 'react'; } catch (_) {}
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width:768px)').matches) {
      return;
    }

    const video = document.getElementById('ipodVideo');
    if (!video) return;
    const ui = {
      title: document.getElementById('ipodTitle'),
      artist: document.getElementById('ipodArtist'),
      prev: document.getElementById('btnPrev'),
      next: document.getElementById('btnNext'),
      play: document.getElementById('btnPlay'),
      wheel: document.getElementById('ipodWheel'),
    };

    let i = 0, interacted = false, keyboardEnabled = false;
    const ipodScreen = document.querySelector('.ipod-screen');

    const onLoadedMeta = () => {
      const w = video.videoWidth || 4;
      const h = video.videoHeight || 3;
      if (ipodScreen) ipodScreen.style.aspectRatio = `${w} / ${h}`;
    };
    video.addEventListener('loadedmetadata', onLoadedMeta);

    let history = [];
    let bag = [];
    function shuffleLocal(a) {
      for (let j = a.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [a[j], a[k]] = [a[k], a[j]];
      }
      return a;
    }
    function refillBag(excludeIndex) {
      const candidates = [...Array(VIDEOS.length).keys()].filter(idx => idx !== excludeIndex);
      bag = shuffleLocal(candidates);
    }
    function loadVideo(index, autoplay = false) {
      i = (index + VIDEOS.length) % VIDEOS.length;
      const v = VIDEOS[i];
      if (ui.title) ui.title.textContent = v.title || '';
      if (ui.artist) ui.artist.textContent = v.artist || '';
      video.src = v.src;
      if (v.poster) video.setAttribute('poster', v.poster); else video.removeAttribute('poster');
      if (autoplay) { video.play().catch(() => {}); }
    }
    function next() {
      if (!bag.length) refillBag(i);
      history.push(i);
      const ni = bag.shift();
      loadVideo(ni, true);
    }
    function prev() {
      if (history.length) {
        const ni = history.pop();
        loadVideo(ni, true);
      } else {
        loadVideo(i - 1, true);
      }
    }
    async function togglePlay() {
      try {
        if (video.paused) {
          video.muted = false;
          await video.play();
          interacted = true;
        } else {
          video.pause();
        }
      } catch (_e) {}
    }
    function stopPlayback() { try { video.pause(); video.currentTime = 0; } catch (_) {} }

    const onPrev = () => prev();
    const onNext = () => next();
    const onPlay = () => togglePlay();
    const onPlayDbl = (e) => { e.preventDefault(); stopPlayback(); };
    ui.prev && ui.prev.addEventListener('click', onPrev);
    ui.next && ui.next.addEventListener('click', onNext);
    ui.play && ui.play.addEventListener('click', onPlay);
    ui.play && ui.play.addEventListener('dblclick', onPlayDbl);

    const onEnded = () => next();
    video.addEventListener('ended', onEnded);

    const onKeyDown = (e) => {
      if (!keyboardEnabled) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    document.addEventListener('keydown', onKeyDown);

    [ui.prev, ui.next, ui.play, ui.wheel, video].forEach(el => {
      if (!el) return;
      el.addEventListener('click', async () => {
        if (!interacted) {
          try {
            video.muted = false;
            await video.play();
            interacted = true;
            keyboardEnabled = true;
          } catch (_) {}
        }
      }, { once: true });
    });

    // clickwheel
    let dragging = false, lastA = null, accum = 0;
    const STEP = 70;
    function angle(e) {
      const r = ui.wheel.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const p = e.touches ? e.touches[0] : e;
      return Math.atan2(p.clientY - cy, p.clientX - cx) * 180 / Math.PI;
    }
    function start(e) { dragging = true; lastA = angle(e); e.preventDefault(); }
    function move(e) {
      if (!dragging) return;
      const a = angle(e);
      const da = a - lastA;
      lastA = a;
      accum += da;
      if (Math.abs(accum) > STEP) {
        if (accum > 0) next(); else prev();
        accum = 0;
      }
      e.preventDefault();
    }
    function end() { dragging = false; lastA = null; accum = 0; }
    const onTouchStart = (e) => start(e);
    const onTouchMove = (e) => move(e);
    const onTouchEnd = () => end();
    ui.wheel && ui.wheel.addEventListener('mousedown', onTouchStart);
    document.addEventListener('mousemove', onTouchMove);
    document.addEventListener('mouseup', onTouchEnd);
    ui.wheel && ui.wheel.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);

    // initial state
    try { loadVideo(0, false); } catch (_) {}

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMeta);
      ui.prev && ui.prev.removeEventListener('click', onPrev);
      ui.next && ui.next.removeEventListener('click', onNext);
      if (ui.play) {
        ui.play.removeEventListener('click', onPlay);
        ui.play.removeEventListener('dblclick', onPlayDbl);
      }
      video.removeEventListener('ended', onEnded);
      document.removeEventListener('keydown', onKeyDown);
      ui.wheel && ui.wheel.removeEventListener('mousedown', onTouchStart);
      document.removeEventListener('mousemove', onTouchMove);
      document.removeEventListener('mouseup', onTouchEnd);
      ui.wheel && ui.wheel.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <aside className="music-drawer" id="musicDrawer">
      <button
        className="music-drawer__trigger"
        id="musicTrigger"
        aria-controls="musicPanel"
        aria-expanded="false"
        aria-label="Abrir reproductor"
      >
        <img className="music-drawer__icon" src="/ipod/IPod_29_2009.webp" alt="Reproductor" />
      </button>

      <div className="music-drawer__panel" id="musicPanel" role="region" aria-label="Reproductor iPod">
        {/* iPod MINI */}
        <div className="ipod-photo" aria-label="iPod mini">
          <div className="overlay">
            <div className="ipod-screen">
              <video id="ipodVideo" playsInline preload="metadata" />
              <div>
                <div className="ipod-title" id="ipodTitle"></div>
                <div className="ipod-artist" id="ipodArtist"></div>
              </div>
            </div>
            <div className="ipod-wheel" id="ipodWheel">
              <button className="ipod-hotzone prev" id="btnPrev" aria-label="Anterior" title="Anterior"></button>
              <button className="ipod-hotzone next" id="btnNext" aria-label="Siguiente" title="Siguiente"></button>
              <button className="ipod-hotzone play" id="btnPlay" aria-label="Play/Pause" title="Play/Pause"></button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
