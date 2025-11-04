'use client';

import { useEffect } from 'react';

export default function BackgroundCanvas() {
  useEffect(() => {
    try { window.PB_BG_OWNER = 'react'; } catch (_) {}
    const canvas = document.getElementById('bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    const CFG = (typeof window !== 'undefined' && window.CONFIG) || {};
    const framesPath = CFG.framesPath || '/frames/frame_';
    const totalFrames = CFG.totalFrames || 150;
    const fps = CFG.fps || 24;
    const pad = CFG.pad || 3;

    let W = 0, H = 0, start = performance.now(), running = true;
    const frames = new Array(totalFrames);
    let loaded = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width || window.innerWidth;
      H = rect.height || window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();

    const zpad = (n) => String(n).padStart(pad, '0');
    function load(i) {
      return new Promise((resolve) => {
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => resolve(im);
        im.onerror = () => resolve(null);
        im.src = `${framesPath}${zpad(i + 1)}.webp`;
      });
    }
    (async () => {
      const B = 10;
      for (let i = 0; i < totalFrames; i++) {
        frames[i] = load(i).then(img => { if (img) loaded++; return img; });
        if ((i + 1) % B === 0) await Promise.all(frames.slice(i + 1 - B, i + 1));
      }
    })();

    function draw(img) {
      if (!img) return;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const s = Math.max(W / iw, H / ih);
      const w = iw * s, h = ih * s, x = (W - w) / 2, y = (H - h) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, x, y, w, h);
    }
    function loop(t) {
      if (!running) { requestAnimationFrame(loop); return; }
      const ready = Math.max(1, Math.min(loaded, totalFrames));
      const idx = Math.floor(((t - start) / 1000 * fps) % ready);
      Promise.resolve(frames[idx]).then(draw);
      requestAnimationFrame(loop);
    }
    const raf = requestAnimationFrame(loop);
    const onVis = () => {
      running = (document.visibilityState === 'visible');
      if (running) start = performance.now();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', resize);
      try { cancelAnimationFrame(raf); } catch (_) {}
    };
  }, []);

  return <canvas id="bg" aria-hidden="true"></canvas>;
}
