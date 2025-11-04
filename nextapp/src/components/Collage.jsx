'use client';

import { useEffect } from 'react';

export default function Collage() {
  useEffect(() => {
    try { window.PB_COLLAGE_OWNER = 'react'; } catch (_) {}

    function centerOut(n){
      const out=[]; if(n<=0) return out;
      if(n%2===1){ const mid=(n-1)/2; out.push(mid);
        for(let d=1; out.length<n; d++){ if(mid-d>=0) out.push(mid-d); if(mid+d<n) out.push(mid+d);} }
      else { const L=n/2-1, R=n/2; out.push(L,R);
        for(let d=1; out.length<n; d++){ if(L-d>=0) out.push(L-d); if(R+d<n) out.push(R+d);} }
      return out;
    }
    function shuffle(arr, rnd){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }
    const clamp = (x,min,max)=> Math.min(max, Math.max(min,x));
    function mulberry32(seed){ return function(){ let t=seed+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; } }
    function getSeed(){ try{ if(window._pbSeed!=null) return window._pbSeed; const u=new Uint32Array(1); crypto.getRandomValues(u); window._pbSeed=u[0]||Math.floor(Date.now()%1e9); }catch{ window._pbSeed=Math.floor(Date.now()%1e9);} return window._pbSeed; }
    const basename = (p)=> (p||'').split('/').pop();
    const applyAlias = (name)=> (window.ALIASES? window.ALIASES[name] : name) || name;
    function fixAssetUrl(u){ if(!u) return u; const b=applyAlias(basename(u)); return u.replace(/[^/]*$/, b); }

    function buildItemsFromModels(PB_MODELS){
      const items=[]; if(!PB_MODELS) return items;
      for (const [modelId, model] of Object.entries(PB_MODELS)) {
        const variants = model.variants || [];
        const byColor = new Map();
        const SIZE_NAMES = ['size','talla','taille','größe','grösse','tamano','tamaño'];
        const SIZE_VALUES = ['xs','s','m','l','xl','xxl','2xl','3xl','4xl','5xl','one size','one-size','talla única','talla unica','única','unica','os'];
        function isSizeName(n){ return SIZE_NAMES.includes(String(n||'').toLowerCase()); }
        function isSizeValue(v){ return SIZE_VALUES.includes(String(v||'').toLowerCase()); }
        function fromSelectedOptions(v){
          const opts = v?.selectedOptions || [];
          // Prefer explicit color-like option name
          const colorOpt = opts.find(o => String(o?.name||'').toLowerCase().includes('color'));
          if (colorOpt && !isSizeValue(colorOpt.value)) return colorOpt.value;
          // Otherwise, first non-size option value
          const nonSize = opts.find(o => !isSizeName(o?.name) && !isSizeValue(o?.value));
          if (nonSize) return nonSize.value;
          return null;
        }
        function fromTitle(v){
          const t = String(v?.title||'');
          if (!t) return null;
          const parts = t.split('/').map(s=>s.trim()).filter(Boolean);
          let guess = parts[0] || t;
          if (isSizeValue(guess.toLowerCase()) && parts.length>1) guess = parts[1];
          if (guess) return guess;
          return null;
        }
        function colorKeyOf(v){
          const viaSel = fromSelectedOptions(v);
          const viaTitle = fromTitle(v);
          const key = viaSel || viaTitle || v?.colorLabel || 'default';
          return String(key).trim().toLowerCase();
        }
        function better(a,b){
          // prefer availableForSale; then one with images; else keep a
          if (!a) return true;
          const aAvail = !!a.availableForSale, bAvail = !!b.availableForSale;
          if (aAvail !== bAvail) return bAvail;
          const aHasImg = !!((a.images||[])[0] || a?.image?.url);
          const bHasImg = !!((b.images||[])[0] || b?.image?.url);
          if (aHasImg !== bHasImg) return bHasImg;
          return false;
        }
        for (const v of variants){
          const ck = colorKeyOf(v);
          const cur = byColor.get(ck);
          if (better(cur, v)) byColor.set(ck, v);
        }
        // If there were no variants, try model images as a single entry
        if (byColor.size === 0 && (model.images||[]).length){
          const first = (model.images||[])[0];
          const url = fixAssetUrl(first);
          const base = applyAlias(basename(first));
          items.push({ base, url, modelId, variantIndex: 0 });
          continue;
        }
        for (const [ck, v] of byColor.entries()){
          if (!v) continue;
          const imgs = (v.images||[]).length ? v.images : (model.images||[]);
          const first = imgs[0] || v?.image?.url;
          if (!first) continue;
          const url = fixAssetUrl(first);
          const base = applyAlias(basename(v.key || first));
          const variantIndex = Math.max(0, (model.variants||[]).indexOf(v));
          items.push({ base, url, modelId, variantIndex });
        }
      }
      return items;
    }

    function renderCollage(){
      const PB_MODELS = window.PB_MODELS || {};
      const CFG = window.CONFIG || {};
      const $collage = document.getElementById('collage');
      const $hero = document.getElementById('hero');
      if (!$collage || !$hero) return;

      const allItems = buildItemsFromModels(PB_MODELS);
      if (!allItems.length){ $collage.innerHTML=''; $collage.style.height='0px'; return; }

      const seed = (CFG.seed ?? getSeed());
      const rnd = mulberry32(seed);
      const items = shuffle([...allItems], rnd);

      const heroH = $hero.getBoundingClientRect().height;
      const availH = Math.max(220, window.innerHeight - heroH);
      const rectW = clamp(window.innerWidth * (CFG.widthFactor||0.76), window.innerWidth * 0.55, window.innerWidth - 2 * (CFG.sideSafe||10));
      const rectL = (window.innerWidth - rectW) / 2;
      const rectT = 0;

      const isMobile = window.matchMedia && window.matchMedia('(max-width:768px)').matches;
      const colsMin = isMobile ? 2 : 3;
      const colsMax = 10;
      const maxHeight = availH * (1 + (CFG.scrollAllowancePct||0.22));

      let best=null;
      function layout(cols, scale){
        const cellW = (rectW / cols) * scale;
        const rowPitch = Math.max(120, cellW * (CFG.rowPitchScale||0.84));
        const rows = Math.ceil(items.length / cols);
        const rectH = rows * rowPitch + (CFG.topSafe||8) + (CFG.bottomSafe||10);
        return { cellW, rowPitch, rows, rectH, cols, scale };
      }
      for(let c=colsMin;c<=colsMax;c++){
        for(let s=1.05;s>=0.60;s-=0.02){
          const L = layout(c,s);
          if (L.rectH <= maxHeight){
            const score = L.cellW - Math.abs(maxHeight - L.rectH) * 0.0015;
            if (!best || score > best.score) best = { ...L, score };
            break;
          }
        }
      }
      if (!best) best = layout(colsMax, 0.60);

      const { cols, cellW, rowPitch, rows, scale } = best;
      const rotMax = isMobile ? (CFG.rotMaxMobile||4) : (CFG.rotMaxDesktop||6);
      const jx = cellW * (CFG.jitterXPct||0.10);
      const jy = rowPitch * (CFG.jitterYPct||0.10);
      const rectH = rows * rowPitch + (CFG.topSafe||8) + (CFG.bottomSafe||10);
      $collage.style.height = rectH + 'px';
      $collage.innerHTML = '';

      const rowOrder = (CFG.distributeFromCenter!==false) ? centerOut(rows) : [...Array(rows).keys()];
      const colOrder = (CFG.distributeFromCenter!==false) ? centerOut(cols) : [...Array(cols).keys()];

      let index=0;
      for (const r of rowOrder){
        for (const c of colOrder){
          if (index >= items.length) break;
          let ax = rectL + (c + 0.5) * (rectW / cols);
          let ay = rectT + (CFG.topSafe||8) + (r + 0.5) * rowPitch;
          ax += (rnd()*2-1)*jx; ay += (rnd()*2-1)*jy;
          if (rnd() < (CFG.overlapChance||0.28)){
            if (rnd() < 0.5){ ax += (rnd()<0.5?-1:1) * (cellW * (CFG.overlapPushXPct||0.18)); }
            else { ay += (rnd()<0.5?-1:1) * (rowPitch * (CFG.overlapPushYPct||0.16)); }
          }
          ax = clamp(ax, rectL + (CFG.sideSafe||10), rectL + rectW - (CFG.sideSafe||10));
          ay = clamp(ay, rectT + (CFG.topSafe||8), rectT + rectH - (CFG.bottomSafe||10));
          const sc = ((CFG.scaleMin||0.94) + rnd() * ((CFG.scaleMax||1.02) - (CFG.scaleMin||0.94))) * (scale||1);
          const rot = (rnd()*2*rotMax - rotMax).toFixed(1) + 'deg';
          const z = Math.floor(r * cols + c + rnd() * (CFG.zSpread||1200));

          const { base, url, modelId, variantIndex } = items[index++];
          const el = document.createElement('div');
          el.className = 'piece';
          el.style.setProperty('--tx', (ax - window.innerWidth/2) + 'px');
          el.style.setProperty('--ty', (ay -  (rectT + rectH/2)) + 'px');
          el.style.setProperty('--rot', rot);
          el.style.setProperty('--sc', sc);
          el.style.setProperty('--z', z);
          el.style.setProperty('--w', `${Math.max(80, Math.floor(cellW))}px`);
          el.dataset.base = base;
          if (modelId) el.dataset.modelId = modelId;
          if (variantIndex != null) el.dataset.variantIndex = String(variantIndex);
          el.innerHTML = `<img src="${url}" alt="${base}">`;
          $collage.appendChild(el);
        }
      }
    }

    // expose for other components
    window.pbRefreshCollage = renderCollage;

    // also render immediately if models already loaded
    try { if (window.PB_MODELS_LOADED) renderCollage(); } catch (_) {}

    // click handler to open modal
    const $collage = document.getElementById('collage');
    const onClick = (e) => {
      const piece = e.target.closest('.piece');
      if (!piece) return;
      const modelId = piece.dataset.modelId;
      const variantIndex = parseInt(piece.dataset.variantIndex || '0', 10);
      if (modelId && typeof window.openProductModalByModelAndVariant === 'function') {
        window.openProductModalByModelAndVariant(modelId, variantIndex);
        return;
      }
      const img = piece.querySelector('img');
      if (!img) return;
      const srcURL = img.getAttribute('src') || '';
      const baseName = (srcURL.split('/').pop() || '').split('?')[0];
      if (typeof window.openProductModalFromCollage === 'function') {
        window.openProductModalFromCollage(baseName);
      }
    };
    $collage && $collage.addEventListener('click', onClick);

    return () => {
      $collage && $collage.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <main role="main">
      <h1 className="sr-only">Catálogo — Pórtate Bien</h1>
      <section id="collage" className="collage" aria-label="Prendas en collage"></section>
    </main>
  );
}
