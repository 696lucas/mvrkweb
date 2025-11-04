/* ================= CONFIG ================= */
const CONFIG = {
  /* Fondo */
  framesPath: "../public/frames/frame_", totalFrames: 150, fps: 24, pad: 3,

  /* Rectángulo de colocación */
  widthFactor: 0.76, sideSafe: 10, topSafe: 8, bottomSafe: 10,

  /* Grid suave (anclas + jitter) */
  minCellDesktop: 200, minCellMobile: 160,
  rowPitchScale: 0.84, jitterXPct: 0.10, jitterYPct: 0.10,
  overlapChance: 0.28, overlapPushXPct: 0.18, overlapPushYPct: 0.16,

  /* Desorden bonito */
  rotMaxDesktop: 6, rotMaxMobile: 4,
  scaleMin: 0.94, scaleMax: 1.02,

  /* Capas para solape */
  zSpread: 1200,

  /* Scroll vertical permitido */
  scrollAllowancePct: 0.22,

  /* Distribución desde el centro */
  distributeFromCenter: true,

  seed: null
};

/* ============== FONDO (canvas por frames) ============== */
(() => {
  const { framesPath, totalFrames, fps, pad } = CONFIG;
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d', { alpha:true, desynchronized:true });
  let W,H, start = performance.now(), running = true;
  const frames = new Array(totalFrames);
  let loaded = 0;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth = innerWidth;
    H = canvas.clientHeight = innerHeight;
    canvas.width = Math.floor(W*dpr); canvas.height = Math.floor(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  };
  addEventListener('resize', resize, { passive:true }); resize();

  const zpad = n => String(n).padStart(pad,'0');
  function load(i){
    return new Promise(r=>{
      const im = new Image();
      im.decoding="async";
      im.onload=()=>r(im);
      im.onerror=()=>r(null);
      im.src = `${framesPath}${zpad(i+1)}.webp`;
    });
  }
  (async ()=>{
    const B=10;
    for(let i=0;i<totalFrames;i++){
      frames[i] = load(i).then(img=>{ if(img) loaded++; return img; });
      if((i+1)%B===0) await Promise.all(frames.slice(i+1-B,i+1));
    }
  })();

  function draw(img){
    if(!img) return;
    const iw=img.naturalWidth, ih=img.naturalHeight;
    const s=Math.max(W/iw,H/ih);
    const w=iw*s, h=ih*s, x=(W-w)/2, y=(H-h)/2;
    ctx.clearRect(0,0,W,H); ctx.drawImage(img,x,y,w,h);
  }
  function loop(t){
    if(!running){ requestAnimationFrame(loop); return; }
    const ready=Math.max(1, Math.min(loaded, totalFrames));
    const idx=Math.floor(((t-start)/1000*fps)%ready);
    Promise.resolve(frames[idx]).then(draw);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  document.addEventListener('visibilitychange',()=>{
    running=(document.visibilityState==='visible');
    if(running) start=performance.now();
  });
})();

/* ============== UTILIDADES ============== */
function mulberry32(seed){
  return function(){
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function getSeed(){
  if (window._pbSeed != null) return window._pbSeed;
  try{
    const u=new Uint32Array(1);
    crypto.getRandomValues(u);
    window._pbSeed=u[0]||Math.floor(Date.now()%1e9);
  }catch{
    window._pbSeed=Math.floor(Date.now()%1e9);
  }
  return window._pbSeed;
}
const clamp = (x,min,max)=>Math.min(max,Math.max(min,x));
function shuffle(arr, rnd){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(rnd()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

/* ---- Normaliza basenames / typos (por si usas assets viejos) ---- */
const ASSETS_BASE_A = "/fotoscatalogoweb/";
const ASSETS_BASE_B = "../public/fotoscatalogoweb/";

const ALIASES = {
  "camisetagagafasblanca.png": "camisetagafasblanca.png",
  "camsietapatronrojo.png": "camisetapatronrojo.png"
};

function basename(path){ return (path||"").split("/").pop(); }
function applyAlias(name){ return ALIASES[name] || name; }

function fixAssetUrl(u){
  if (!u) return u;
  // Para URLs de Shopify no cambia nada (solo sustituyo el último segmento por sí mismo)
  const b = applyAlias(basename(u));
  return u.replace(/[^/]*$/, b);
}

/* Orden centro→fuera */
function centerOut(n){
  const out = [];
  if (n <= 0) return out;
  if (n % 2 === 1){
    const mid = (n - 1) / 2;
    out.push(mid);
    for (let d = 1; out.length < n; d++){
      if (mid - d >= 0) out.push(mid - d);
      if (mid + d < n)  out.push(mid + d);
    }
  } else {
    const L = n/2 - 1, R = n/2;
    out.push(L, R);
    for (let d = 1; out.length < n; d++){
      if (L - d >= 0) out.push(L - d);
      if (R + d < n)  out.push(R + d);
    }
  }
  return out;
}

/* ===========================================================
   DATA DE PRODUCTO: MODELOS (SOLO SHOPIFY)
   =========================================================== */
// Objeto global que Shopify rellenará
window.PB_MODELS = window.PB_MODELS || {};
const PB_MODELS = window.PB_MODELS;

/* ============== COLLAGE RENDER (solo Shopify) ============== */
(function(){
  const $collage = document.getElementById('collage');
  const $hero = document.getElementById('hero');

  function buildItemsFromModels(){
    const items = [];
    if (!PB_MODELS) return items;

    for (const [modelId, model] of Object.entries(PB_MODELS)){
      const variants = model.variants || [];
      variants.forEach((v, idx)=>{
        const imgs = v.images || [];
        const first = imgs[0];
        if (!first) return;
        const url = fixAssetUrl(first);
        const base = applyAlias(basename(v.key || first));
        items.push({
          base,
          url,
          modelId,
          variantIndex: idx
        });
      });
    }
    return items;
  }

  function render(){
    if (!$collage || !$hero) return;

    const allItems = buildItemsFromModels();
    if (!allItems.length){
      $collage.innerHTML = "";
      $collage.style.height = "0px";
      return;
    }

    const seed = CONFIG.seed ?? getSeed();
    const rnd  = mulberry32(seed);

    const items = shuffle([...allItems], rnd);

    const heroH = $hero.getBoundingClientRect().height;
    const availH = Math.max(220, innerHeight - heroH);

    const rectW = clamp(innerWidth * CONFIG.widthFactor, innerWidth*0.55, innerWidth - 2*CONFIG.sideSafe);
    const rectL = (innerWidth - rectW) / 2;
    const rectT = 0;

    const isMobile = matchMedia("(max-width:768px)").matches;
    const colsMin = isMobile ? 2 : 3;
    const colsMax = 10;
    const maxHeight = availH * (1 + CONFIG.scrollAllowancePct);

    let best = null;
    function layout(cols, scale){
      const cellW = (rectW / cols) * scale;
      const rowPitch = Math.max(120, cellW * CONFIG.rowPitchScale);
      const rows = Math.ceil(items.length / cols);
      const rectH = rows * rowPitch + CONFIG.topSafe + CONFIG.bottomSafe;
      return { cellW, rowPitch, rows, rectH, cols, scale };
    }
    for (let c = colsMin; c <= colsMax; c++){
      for (let s = 1.05; s >= 0.60; s -= 0.02){
        const L = layout(c, s);
        if (L.rectH <= maxHeight){
          const score = L.cellW - Math.abs(maxHeight - L.rectH) * 0.0015;
          if (!best || score > best.score) best = { ...L, score };
          break;
        }
      }
    }
    if (!best) best = layout(colsMax, 0.60);

    const { cols, cellW, rowPitch, rows, scale } = best;

    const rotMax = isMobile ? CONFIG.rotMaxMobile : CONFIG.rotMaxDesktop;
    const jx = cellW * CONFIG.jitterXPct;
    const jy = rowPitch * CONFIG.jitterYPct;

    const rectH = rows * rowPitch + CONFIG.topSafe + CONFIG.bottomSafe;
    $collage.style.height = rectH + "px";

    $collage.innerHTML = '';

    const rowOrder = CONFIG.distributeFromCenter ? centerOut(rows) : [...Array(rows).keys()];
    const colOrder = CONFIG.distributeFromCenter ? centerOut(cols)  : [...Array(cols).keys()];

    let index = 0;
    for (const r of rowOrder){
      for (const c of colOrder){
        if (index >= items.length) break;

        let ax = rectL + (c + 0.5) * (rectW / cols);
        let ay = rectT + CONFIG.topSafe + (r + 0.5) * rowPitch;

        ax += (rnd()*2-1) * jx;
        ay += (rnd()*2-1) * jy;

        if (rnd() < CONFIG.overlapChance){
          if (rnd() < 0.5){
            ax += (rnd()<0.5?-1:1) * (cellW * CONFIG.overlapPushXPct);
          }else{
            ay += (rnd()<0.5?-1:1) * (rowPitch * CONFIG.overlapPushYPct);
          }
        }

        ax = clamp(ax, rectL + CONFIG.sideSafe, rectL + rectW - CONFIG.sideSafe);
        ay = clamp(ay, rectT + CONFIG.topSafe, rectT + rectH - CONFIG.bottomSafe);

        let sc  = (CONFIG.scaleMin + rnd()*(CONFIG.scaleMax - CONFIG.scaleMin)) * (scale || 1);
        const rot = (rnd()*2*rotMax - rotMax).toFixed(1) + 'deg';
        const z   = Math.floor(r * cols + c + rnd()*CONFIG.zSpread);

        const it = items[index++];

        const fig = document.createElement('figure');
        fig.className = 'piece';
        fig.style.left = `${ax}px`;
        fig.style.top  = `${ay}px`;
        fig.style.setProperty('--rot', rot);
        fig.style.setProperty('--sc',  sc.toFixed(3));
        fig.style.setProperty('--tx',  '0px');
        fig.style.setProperty('--ty',  '0px');
        fig.style.setProperty('--z',   z);
        // vínculo directo con Shopify
        fig.dataset.modelId      = it.modelId;
        fig.dataset.variantIndex = String(it.variantIndex);

        const img = document.createElement('img');
        img.alt = it.base.replace(/\.(png|webp|jpg|jpeg)$/i,'');
        img.loading = 'lazy';
        img.decoding = 'async';
        img.src = it.url;

        let w = clamp(cellW * (0.88 + rnd()*0.18), 100, 380);
        img.style.setProperty('--w', Math.round(w) + 'px');

        fig.appendChild(img);
        $collage.appendChild(fig);
      }
    }
  }

  // Dejo un hook para que Shopify refresque el collage cuando tenga datos
  window.pbRefreshCollage = render;
})();

/* Toggle clase at-top */
(function(){
  const TOGGLE_CLASS = 'at-top';
  const updateTopClass = () => {
    if (window.scrollY <= 2) document.documentElement.classList.add(TOGGLE_CLASS);
    else document.documentElement.classList.remove(TOGGLE_CLASS);
  };
  window.addEventListener('load', updateTopClass, { passive:true });
  window.addEventListener('scroll', updateTopClass, { passive:true });
  window.addEventListener('touchmove', updateTopClass, { passive:true });
  window.addEventListener('resize', updateTopClass);
})();

/* ===== Playlist de vídeos del iPod ===== */
const VIDEOS = [
  { src: "../public/videos/nostoi.mp4",    title: "Nostoi" },
  { src: "../public/videos/360.mp4",       title: "360" },
  { src: "../public/videos/blowme.mp4",    title: "Blow Me" },
  { src: "../public/videos/callaito.mp4",  title: "Callaito" },
  { src: "../public/videos/jim.mp4",       title: "Jim" },
  { src: "../public/videos/keef.mp4",      title: "Keef" },
  { src: "../public/videos/marlo.mp4",     title: "Marlo" },
  { src: "../public/videos/moneyspread.mp4", title: "Money Spread" },
  { src: "../public/videos/perrabb.mp4",   title: "Perrabb" },
  { src: "../public/videos/sonrie.mp4",    title: "Sonríe" },
  { src: "../public/videos/teniafe.mp4",   title: "Tenía Fe" },
  { src: "../public/videos/toymb.mp4",     title: "Toy MB" },
  { src: "../public/videos/yeat.mp4",      title: "Yeat" }
];

/* iPod video player */
(function(){
  if (window.matchMedia && window.matchMedia('(max-width:768px)').matches) return;

  const video = document.getElementById('ipodVideo');
  const ui = {
    title : document.getElementById('ipodTitle'),
    artist: document.getElementById('ipodArtist'),
    prev  : document.getElementById('btnPrev'),
    next  : document.getElementById('btnNext'),
    play  : document.getElementById('btnPlay'),
    wheel : document.getElementById('ipodWheel')
  };

  let i = 0, interacted = false;

  const ipodScreen = document.querySelector('.ipod-screen');
  video.addEventListener('loadedmetadata', ()=>{
    const w = video.videoWidth || 4;
    const h = video.videoHeight || 3;
    ipodScreen.style.aspectRatio = `${w} / ${h}`;
  });

  let history = [];
  let bag = [];
  function shuffleLocal(a){
    for (let j=a.length-1; j>0; j--){
      const k = Math.floor(Math.random()*(j+1));
      [a[j], a[k]] = [a[k], a[j]];
    }
    return a;
  }
  function refillBag(excludeIndex){
    const candidates = [...Array(VIDEOS.length).keys()].filter(idx => idx !== excludeIndex);
    bag = shuffleLocal(candidates);
  }

  function loadVideo(index, autoplay=false){
    i = (index + VIDEOS.length) % VIDEOS.length;
    const v = VIDEOS[i];
    ui.title.textContent  = v.title  || '';
    ui.artist.textContent = v.artist || '';
    video.src = v.src;
    if (v.poster) video.setAttribute('poster', v.poster); else video.removeAttribute('poster');
    if (autoplay) { video.play().catch(()=>{}); }
  }

  function next(){
    if (!bag.length) refillBag(i);
    history.push(i);
    const ni = bag.shift();
    loadVideo(ni, true);
  }
  function prev(){
    if (history.length){
      const ni = history.pop();
      loadVideo(ni, true);
    } else {
      loadVideo(i-1, true);
    }
  }

  async function togglePlay(){
    try{
      if (video.paused) {
        video.muted = false;
        await video.play();
        interacted = true;
      } else {
        video.pause();
      }
    }catch(e){}
  }

  function stopPlayback(){
    try{ video.pause(); video.currentTime = 0; }catch(e){}
  }

  ui.prev.addEventListener('click', prev);
  ui.next.addEventListener('click', next);
  ui.play.addEventListener('click', togglePlay);
  ui.play.addEventListener('dblclick', (e)=>{ e.preventDefault(); stopPlayback(); });

  video.addEventListener('ended', next);

  let keyboardEnabled = false;
  document.addEventListener('keydown', function(e){
    if (!keyboardEnabled) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  });

  [ui.prev, ui.next, ui.play, ui.wheel, video].forEach(el=>{
    el.addEventListener('click', async ()=>{
      if (!interacted){
        try{
          video.muted = false;
          await video.play();
          interacted = true;
          keyboardEnabled = true;
        }catch(_){}
      }
    }, { once:true });
  });

  // clickwheel
  let dragging=false, lastA=null, accum=0;
  const STEP=70;
  function angle(e){
    const r=ui.wheel.getBoundingClientRect();
    const cx=r.left+r.width/2, cy=r.top+r.height/2;
    const p=e.touches?e.touches[0]:e;
    return Math.atan2(p.clientY-cy, p.clientX-cx)*180/Math.PI;
  }
  function start(e){ dragging=true; lastA=angle(e); e.preventDefault(); }
  function move(e){
    if(!dragging) return;
    let a=angle(e), d=a-lastA;
    if(d>180) d-=360;
    if(d<-180) d+=360;
    lastA=a;
    accum+=d;
    if(accum>=STEP){ next(); accum=0; }
    if(accum<=-STEP){ prev(); accum=0; }
  }
  function end(){ dragging=false; accum=0; }
  ui.wheel.addEventListener('pointerdown',start);
  addEventListener('pointermove',move);
  addEventListener('pointerup',end);
  ui.wheel.addEventListener('touchstart',start,{passive:false});
  addEventListener('touchmove',move,{passive:false});
  addEventListener('touchend',end);

  (function(){
    const isDesktop = matchMedia('(hover:hover) and (pointer:fine)').matches;
    if(!isDesktop) return;
    function wireButton(el){
      if(!el) return;
      let pressed=false;
      el.addEventListener('pointerdown', e=>{
        e.preventDefault(); pressed=true;
        el.classList.add('is-pressing');
      });
      el.addEventListener('pointerup',   ()=>{
        if(!pressed) return; pressed=false;
        el.classList.remove('is-pressing');
        el.classList.add('pop');
        setTimeout(()=>el.classList.remove('pop'), 200);
      });
      el.addEventListener('pointerleave',()=>{ pressed=false; el.classList.remove('is-pressing'); });
      el.addEventListener('pointercancel',()=>{ pressed=false; el.classList.remove('is-pressing'); });
    }
    wireButton(ui.prev); wireButton(ui.next); wireButton(ui.play);
  })();

  loadVideo(0, false);
  refillBag(0);
})();

/* ===========================================================
   HELPERS (modal)
   =========================================================== */
function findModelByVariantKey(variantKey){
  const key = applyAlias(basename(variantKey));
  for (const modelId in PB_MODELS){
    const model = PB_MODELS[modelId];
    const idx = (model.variants || []).findIndex(v => applyAlias(basename(v.key)) === key);
    if (idx !== -1){
      return { modelId, model, variantIndex: idx };
    }
  }
  return null;
}

function getRelatedKeys(currentVariantKey){
  const current = applyAlias(basename(currentVariantKey || ""));

  const allKeys = new Set();
  for (const m of Object.values(PB_MODELS)){
    for (const v of (m.variants || [])){
      const k = applyAlias(basename(v.key || ""));
      if (k && k !== current) allKeys.add(k);
    }
  }
  const arr = Array.from(allKeys);
  for (let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr.slice(0,5);
}

/* ===========================================================
   DOM REFS (modal)
   =========================================================== */
const bodyEl        = document.body;
const modalEl       = document.getElementById('pbProductModal');
const overlayEl     = document.getElementById('pbModalOverlay');
const closeBtn      = document.getElementById('pbProdCloseBtn');

const titleEl       = document.getElementById('pbProdTitle');
const priceEl       = document.getElementById('pbProdPrice');
const descEl        = document.getElementById('pbProdDesc');

const colorRowEl    = document.getElementById('pbColorRow');
const colorsBlockEl = document.querySelector('.pb-prod-colors-block');

const qtyBoxEl      = document.getElementById('pbQtyBox');
const qtyNumEl      = document.getElementById('pbQtyNum');
const atcBtnEl      = document.getElementById('pbATCBtn');

const carouselImgEl = document.getElementById('pbCarouselImage');
const prevArrow     = document.getElementById('pbCarouselPrev');
const nextArrow     = document.getElementById('pbCarouselNext');

const relatedRowEl  = document.getElementById('pbRelatedRow');

const collageEl     = document.getElementById('collage');

const cardEl = document.querySelector('.pb-product-modal-card');
if (cardEl){
  cardEl.addEventListener('click', function(ev){
    if (ev.target === cardEl) closeProductModal();
  });
}

/* ===========================================================
   STATE (modal)
   =========================================================== */
let activeModelId = null;
let activeVariantIndex = 0;

let currentImages = [];
let currentImageIndex = 0;

/* ===========================================================
   RENDER CAROUSEL (modal)
   =========================================================== */
function renderCarouselImage(){
  if(!currentImages.length) return;
  const url = fixAssetUrl(currentImages[currentImageIndex]);

  carouselImgEl.style.opacity   = "0";
  carouselImgEl.style.transform = "scale(.96)";

  setTimeout(()=>{
    carouselImgEl.src = url;
    carouselImgEl.alt = titleEl.textContent || "Producto";
    carouselImgEl.style.opacity   = "1";
    carouselImgEl.style.transform = "scale(1)";
  },100);
}

function goPrevImg(){
  if(!currentImages.length) return;
  currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
  renderCarouselImage();
}
function goNextImg(){
  if(!currentImages.length) return;
  currentImageIndex = (currentImageIndex + 1) % currentImages.length;
  renderCarouselImage();
}
prevArrow.addEventListener('click', goPrevImg);
nextArrow.addEventListener('click', goNextImg);

/* ===========================================================
   BUILD COLOR PILLS
   =========================================================== */
function buildColorPills(model){
  colorRowEl.innerHTML = "";

  const hasRealColors = (
    (model.variants || []).length > 1 ||
    (model.variants || []).some(v => v.colorLabel && v.colorLabel.trim()!=="")
  );
  if (!hasRealColors){
    colorsBlockEl.style.display = "none";
    return;
  }
  colorsBlockEl.style.display = "grid";

  (model.variants || []).forEach((v,i)=>{
    const pill = document.createElement('button');
    pill.className = "pb-color-pill" + (i===activeVariantIndex ? " active" : "");
    pill.textContent = v.colorLabel || ("Color "+(i+1));

    pill.addEventListener('click', (ev)=>{
      ev.stopPropagation();
      if (activeVariantIndex === i) return;

      const prevScroll = modalEl.scrollTop;

      activeVariantIndex = i;
      updateVariantContent(model, model.variants[i]);

      Array.from(colorRowEl.children).forEach((btn,idx)=>{
        btn.classList.toggle('active', idx === activeVariantIndex);
      });

      modalEl.scrollTop = prevScroll;
    });

    colorRowEl.appendChild(pill);
  });
}

/* ===========================================================
   ACTUALIZAR VARIANTE (modal)
   =========================================================== */
function updateVariantContent(model, variant){
  const fullTitle = variant.colorLabel
    ? model.title + " ("+variant.colorLabel+")"
    : model.title;

  titleEl.textContent = fullTitle;
  priceEl.textContent = variant.price || "";
  descEl.textContent  = variant.desc  || "";

  qtyNumEl.textContent = "1";
  atcBtnEl.disabled = true;
  atcBtnEl.textContent = "Agotado";
  atcBtnEl.style.cursor = "not-allowed";
  atcBtnEl.style.opacity = ".6";

  currentImages = Array.isArray(variant.images) ? variant.images.map(fixAssetUrl) : [];
  currentImageIndex = 0;

  renderCarouselImage();
  renderRelated(variant.key);
}

function renderVariant(model, variant){
  buildColorPills(model);
  updateVariantContent(model, variant);
}

/* ===========================================================
   RECOMENDADOS
   =========================================================== */
function renderRelated(currentVariantKey){
  const relKeys = getRelatedKeys(currentVariantKey);
  relatedRowEl.innerHTML = "";

  relKeys.forEach(vKey=>{
    const match = findModelByVariantKey(vKey);
    if(!match) return;

    const { modelId, model, variantIndex } = match;
    const variant = model.variants[variantIndex];
    const firstImg = (variant.images && variant.images[0]) ? fixAssetUrl(variant.images[0]) : "";

    const card = document.createElement('button');
    card.type = "button";
    card.className = "pb-related-card";
    card.innerHTML = `
      <div class="pb-related-imgwrap">
        <img src="${firstImg}" alt="${model.title}">
      </div>
      <div style="color:#fff; font-weight:700; font-size:12px; line-height:1.3;">${model.title}</div>
      <div style="opacity:.7; font-size:12px;">${variant.price || ""}</div>
      <div class="pb-related-chip">${variant.soldOut ? "Agotado" : "Disponible"}</div>
    `;

    card.addEventListener('click', (ev)=>{
      ev.stopPropagation();
      openProductModalByModelAndVariant(modelId, variantIndex);
    });

    relatedRowEl.appendChild(card);
  });
}

/* ===========================================================
   ABRIR / CERRAR MODAL
   =========================================================== */
function openProductModalByModelAndVariant(modelId, variantIndex){
  const model = PB_MODELS[modelId];
  if(!model) return;

  activeModelId = modelId;
  activeVariantIndex = (variantIndex != null ? variantIndex : 0);

  const variant = model.variants[activeVariantIndex];
  renderVariant(model, variant);

  modalEl.classList.add('is-open');
  modalEl.setAttribute('aria-hidden','false');

  bodyEl.classList.add('pb-modal-open');
  modalEl.scrollTop = 0;
}

function openProductModalFromCollage(variantKey, imgURL){
  const match = findModelByVariantKey(variantKey);

  if (match){
    openProductModalByModelAndVariant(match.modelId, match.variantIndex);
    return;
  }

  activeModelId = null;
  activeVariantIndex = 0;

  const fallbackModel = {
    title: applyAlias(basename(variantKey))
      .replace(/\.(png|webp|jpg|jpeg)$/i,"")
      .replace(/[_-]+/g," ")
      .trim(),
    variants: [
      {
        colorLabel: "",
        key: applyAlias(basename(variantKey)),
        price: "",
        desc: "",
        images: [ imgURL ],
        soldOut: true
      }
    ]
  };

  renderVariant(fallbackModel, fallbackModel.variants[0]);

  modalEl.classList.add('is-open');
  modalEl.setAttribute('aria-hidden','false');
  bodyEl.classList.add('pb-modal-open');
  modalEl.scrollTop = 0;
}

function closeProductModal(){
  modalEl.classList.remove('is-open');
  modalEl.setAttribute('aria-hidden','true');
  bodyEl.classList.remove('pb-modal-open');
}

closeBtn.addEventListener('click', (ev)=>{ ev.stopPropagation(); closeProductModal(); });
overlayEl.addEventListener('click', ()=> closeProductModal());
document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeProductModal(); });

const musicDrawerEl = document.getElementById('musicDrawer');
const topIconsEl    = document.querySelector('.pb-top-icons');

document.addEventListener('click', function(e){
  if (!modalEl.classList.contains('is-open')) return;
  const clickTarget = e.target;

  if (cardEl && cardEl.contains(clickTarget)) return;
  if (musicDrawerEl && musicDrawerEl.contains(clickTarget)) return;
  if (topIconsEl && topIconsEl.contains(clickTarget)) return;

  const cartDlgEl = document.getElementById('pb-cart-dlg');
  if (cartDlgEl && cartDlgEl.contains(clickTarget)) return;

  closeProductModal();
}, true);

qtyBoxEl.addEventListener('click', e=>{
  const btn = e.target.closest('.pb-qty-btn');
  if(!btn) return;
  e.stopPropagation();
  let qty = parseInt(qtyNumEl.textContent || "1",10);
  const delta = parseInt(btn.dataset.delta || "0",10);
  qty = clamp(qty + delta, 1, 9);
  qtyNumEl.textContent = String(qty);
});

const collageElRef = document.getElementById('collage');
collageElRef.addEventListener('click', e=>{
  const piece = e.target.closest('.piece');
  if(!piece) return;

  const modelId      = piece.dataset.modelId;
  const variantIndex = parseInt(piece.dataset.variantIndex || "0", 10);

  if (modelId && PB_MODELS[modelId]){
    openProductModalByModelAndVariant(modelId, variantIndex);
    return;
  }

  // Fallback (por si algo no tiene dataset)
  const img = piece.querySelector('img');
  if(!img) return;
  const srcURL   = img.getAttribute('src') || "";
  const baseName = applyAlias(basename(srcURL));
  openProductModalFromCollage(baseName, srcURL);
});

/* ===========================================================
   Shopify Headless + Drawer Carrito
   =========================================================== */
(function () {
  /* === Credenciales Storefront === */
  const SHOPIFY_DOMAIN  = "qhzkkr-2d.myshopify.com";
  const STOREFRONT_TOKEN = "b919997de07b4172affb1803d79a6509";
  const API_URL          = `https://${SHOPIFY_DOMAIN}/api/2025-01/graphql.json`;

  /* === Colección a usar para el collage === */
  const COLLECTION_HANDLE = "frontpage";

  /* === Utils === */
  const formatPrice = (amt, cur = "EUR") =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: cur })
      .format(Number(amt ?? 0));

  const base = (u) => (u ? (u.split("/").pop() || "").split("?")[0] : "");

  async function gql(query, variables = {}) {
    const r = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN
      },
      body: JSON.stringify({ query, variables })
    });
    const j = await r.json();
    if (j.errors) console.error(j.errors);
    return j.data;
  }

  /* === Products (colección) === */
  const COLLECTION_PRODUCTS = `
    query($handle:String!){
      collection(handle:$handle){
        products(first:50){
          edges{
            node{
              id title handle description
              featuredImage { url altText }
              images(first:20){ edges{ node{ url altText } } }
              variants(first:50){
                edges{
                  node{
                    id title availableForSale
                    selectedOptions{ name value }
                    price{ amount currencyCode }
                    image{ url altText }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  /* ========== CART API (2025-01) ========== */
  const CART_CREATE = `
    mutation cartCreate($lines:[CartLineInput!]!){
      cartCreate(input:{ lines:$lines }){
        cart { id checkoutUrl }
        userErrors { field message }
      }
    }
  `;
  const CART_LINES_ADD = `
    mutation cartLinesAdd($cartId:ID!, $lines:[CartLineInput!]!){
      cartLinesAdd(cartId:$cartId, lines:$lines){
        cart { id checkoutUrl }
        userErrors { field message }
      }
    }
  `;
  const CART_LINES_UPDATE = `
    mutation cartLinesUpdate($cartId:ID!, $lines:[CartLineUpdateInput!]!){
      cartLinesUpdate(cartId:$cartId, lines:$lines){
        cart { id }
        userErrors { field message }
      }
    }
  `;
  const CART_LINES_REMOVE = `
    mutation cartLinesRemove($cartId:ID!, $lineIds:[ID!]!){
      cartLinesRemove(cartId:$cartId, lineIds:$lineIds){
        cart { id }
        userErrors { field message }
      }
    }
  `;
  const CART_QUERY = `
    query getCart($id:ID!){
      cart(id:$id){
        id
        checkoutUrl
        totalQuantity
        cost { subtotalAmount { amount currencyCode } }
        lines(first:100){
          edges{
            node{
              id
              quantity
              cost { amountPerQuantity { amount currencyCode } }
              merchandise{
                ... on ProductVariant{
                  id title
                  image{ url altText }
                  product{ title }
                  price { amount currencyCode }
                }
              }
            }
          }
        }
      }
    }
  `;

  /* === Estado Cart === */
  let cartId = sessionStorage.getItem("pb_cart_id") || null;

  async function addToCart(variantId, qty){
    if (!cartId){
      const d = await gql(CART_CREATE, { lines: [{ merchandiseId: variantId, quantity: qty }] });
      cartId = d?.cartCreate?.cart?.id || null;
      if (cartId) sessionStorage.setItem("pb_cart_id", cartId);
    } else {
      await gql(CART_LINES_ADD, { cartId, lines: [{ merchandiseId: variantId, quantity: qty }] });
    }
  }
  async function fetchCart(){
    if (!cartId) return null;
    const d = await gql(CART_QUERY, { id: cartId });
    return d?.cart || null;
  }
  async function goToCheckout(){
    if (!cartId) return;
    const c = await fetchCart();
    const url = c?.checkoutUrl;
    if (url) window.location.href = url;
  }
  window.PB_addToCart = addToCart;
  window.PB_goToCheckout = goToCheckout;

  /* === key imagen -> variant info (EXPUETO en window) === */
  window.KEY_TO_VARIANT ??= new Map();
  const KEY_TO_VARIANT = window.KEY_TO_VARIANT;
    // key imagen -> lista de tallas para ese color
  window.KEY_TO_SIZES ??= new Map();
  const KEY_TO_SIZES = window.KEY_TO_SIZES;


  /* === Shopify -> modelo local === */
 /* === Shopify -> modelo local (agrupa por COLOR; las tallas no se duplican) === */
  /* === Shopify -> modelo local (agrupa por COLOR; tallas no duplicadas) === */
  function toModel(product) {
    const prodImgs = product?.images?.edges?.map(e => e.node.url) || [];
    const variantEdges = product?.variants?.edges || [];

    // Si no hay variantes, 'fallback' simple
    if (!variantEdges.length) {
      const fImg = product?.featuredImage?.url || prodImgs[0] || "";
      const k = base(fImg);
      return {
        title: product?.title || "",
        variants: [{
          colorLabel: "",
          key: k,
          price: "",
          desc: product?.description || "",
          images: prodImgs.slice(0, 3),
          soldOut: true
        }]
      };
    }

    // 1) Agrupar variantes por COLOR (si no hay opción "Color", todas van al mismo grupo)
    const groups = new Map();
    for (const { node } of variantEdges) {
      const opts = node.selectedOptions || [];
      const colorOpt = opts.find(o => (o.name || "").toLowerCase() === "color");
      const colorValue = (colorOpt?.value || "").trim();
      const groupKey = colorValue || "default"; // solo tallas => todas al mismo grupo "default"

      let g = groups.get(groupKey);
      if (!g) {
        g = { colorLabel: colorValue, nodes: [], imageUrl: null };
        groups.set(groupKey, g);
      }
      g.nodes.push(node);

      // Imagen representativa del grupo (color)
      if (!g.imageUrl) {
        g.imageUrl = node.image?.url || product.featuredImage?.url || prodImgs[0] || "";
      }
    }

    const variants = [];

    // 2) Construir UNA variante por grupo de color
    for (const g of groups.values()) {
      const nodes = g.nodes;

      // Variante "principal" del grupo: la primera disponible o, en su defecto, la primera
      const mainNode = nodes.find(n => n.availableForSale) || nodes[0];

      const vImg = g.imageUrl || mainNode.image?.url || product.featuredImage?.url || prodImgs[0] || "";
       const cdnKey = (vImg || "").split("?")[0];
      // Precio y moneda de la variante principal
      const amountNum = Number(mainNode.price?.amount || 0);
      const currency  = mainNode.price?.currencyCode || "EUR";
      const priceStr  = formatPrice(amountNum, currency);

      // Imágenes para el carrusel (la del grupo + resto del producto)
      const images = mainNode.image?.url
        ? [mainNode.image.url, ...prodImgs.filter(u => u !== mainNode.image.url)]
        : [vImg, ...prodImgs.filter(u => u !== vImg)];

      // === TALLAS POR COLOR ===
      const sizeMap = new Map();
      for (const n of nodes) {
        const opts = n.selectedOptions || [];
        const sizeOpt = opts.find(o => {
          const name = (o.name || "").toLowerCase();
          return (
            name === "talla" ||
            name === "tamano" ||
            name === "tamaño" ||
            name === "size"
          );
        });
        if (!sizeOpt) continue;

        const sizeLabel = (sizeOpt.value || "").trim();
        if (!sizeLabel) continue;

        const existing = sizeMap.get(sizeLabel);
        // Preferimos la variante disponible para esa talla
        if (!existing || (n.availableForSale && !existing.available)) {
          sizeMap.set(sizeLabel, {
            label: sizeLabel,
            available: n.availableForSale,
            id: n.id
          });
        }
      }

      const sizes = Array.from(sizeMap.values());
      KEY_TO_SIZES.set(cdnKey, sizes); // guardamos tallas para ese color

      // Disponibilidad global del color: si alguna talla está disponible
      const available = nodes.some(n => n.availableForSale);

      // Mapeo clave imagen -> variante principal del grupo
      const payload = { id: mainNode.id, available, price: priceStr, amount: amountNum, currency };
      KEY_TO_VARIANT.set(cdnKey, payload);

      variants.push({
        colorLabel: g.colorLabel || "",
        key: cdnKey,
        price: priceStr,
        desc: product?.description || "",
        images: images.slice(0, 3),
        soldOut: !available
      });
    }

    return {
      title: product?.title || "",
      variants
    };
  }



  async function loadAllModels() {
    const data = await gql(COLLECTION_PRODUCTS, { handle: COLLECTION_HANDLE });
    const edges = data?.collection?.products?.edges || [];
    const models = {};
    edges.forEach(({ node }) => {
      models[node.handle] = toModel(node);
    });
    return models;
  }

  /* === Estado local para badge/minicart (visual) === */
  function getLocalCart(){
    try{ return JSON.parse(sessionStorage.getItem("pb_cart")||"{}"); }catch{ return {}; }
  }
  function setLocalCart(s){ sessionStorage.setItem("pb_cart", JSON.stringify(s)); }
  function cartAddLocal(amount, currency, qty){
    const s = getLocalCart();
    s.qty = (s.qty||0) + qty;
    s.subtotal = (s.subtotal||0) + (amount*qty);
    s.currency = currency || s.currency || "EUR";
    setLocalCart(s);
    return s;
  }

  /* === Badge + minicart (toast) === */
  let pbPopup, pbHideTO;
  function ensureBadge(){
    const icon = document.querySelector('.pb-cart-trigger') || document.querySelector('a[href="/cart"]');
    if(!icon) return null;
    icon.style.position = 'relative';
    let b = icon.querySelector('.pb-cart-badge');
    if(!b){ b = document.createElement('span'); b.className = 'pb-cart-badge'; icon.appendChild(b); }
    return b;
  }
  function updateBadgeFromState(){
    const s = getLocalCart();
    const b = ensureBadge(); if(!b) return;
    const q = Number(s.qty||0);
    b.textContent = String(q);
    b.style.display = q ? 'inline-flex' : 'none';
  }
  function showMiniCart(){
    const s = getLocalCart();
    if(pbPopup) pbPopup.remove();
    pbPopup = document.createElement('div');
    pbPopup.className = 'pb-minicart';
    pbPopup.innerHTML = `
      <div class="pb-minicart__title">Añadido al carrito</div>
      <div class="pb-minicart__row"><span>Artículos</span><strong>${s.qty||0}</strong></div>
      <div class="pb-minicart__row"><span>Subtotal</span><strong>${formatPrice(s.subtotal||0, s.currency||"EUR")}</strong></div>
      <div class="pb-minicart__actions">
        <button type="button" class="pb-btn" data-action="continue">Seguir comprando</button>
        <button type="button" class="pb-btn pb-btn--primary" data-action="checkout">Ir a pagar</button>
      </div>`;
    document.body.appendChild(pbPopup);

    const icon = document.querySelector('.pb-cart-trigger') || document.querySelector('a[href="/cart"]');
    const r = icon ? icon.getBoundingClientRect() : { top: 0, left: 0, width: 0, height: 0 };
    const top  = Math.max(12, r.top + window.scrollY + r.height + 10);
    const left = Math.min(window.scrollX + r.left + r.width - 320, window.scrollX + r.left);
    Object.assign(pbPopup.style, { top: top+'px', left: left+'px' });
    requestAnimationFrame(()=>pbPopup.classList.add('is-open'));

    pbPopup.onclick = (e)=>{
      const a = e.target.closest('[data-action]');
      if(!a) return;
      if(a.dataset.action === 'checkout'){ goToCheckout(); }
      if(a.dataset.action === 'continue'){ closeMini(); }
    };
    clearTimeout(pbHideTO);
    pbHideTO = setTimeout(closeMini, 3000);
    function closeMini(){ if(pbPopup){ pbPopup.classList.remove('is-open'); setTimeout(()=>pbPopup?.remove(),150); } }
  }

  /* === Hookear el modal con Shopify (ATC real) === */
   /* === Hookear el modal con Shopify (ATC real + TALLAS) === */
  function wireModalBehavior() {
    const qtyNumEl  = document.getElementById("pbQtyNum");
    const atcBtnEl  = document.getElementById("pbATCBtn");
    const priceEl   = document.getElementById("pbProdPrice");
    const modalEl   = document.getElementById("pbProductModal");
    const sizeRowEl = document.getElementById("pbSizeRow");

    let selectedSizeId = null;

    function renderSizeButtons(cdnKey) {
      if (!sizeRowEl) {
        selectedSizeId = null;
        return;
      }

      const sizes = KEY_TO_SIZES.get(cdnKey) || [];
      sizeRowEl.innerHTML = "";

      if (!sizes.length) {
        sizeRowEl.style.display = "none";
        selectedSizeId = null;
        return;
      }

      sizeRowEl.style.display = "";
      selectedSizeId = null;

      sizes.forEach((size) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pb-size-pill";
        btn.textContent = size.label || "";

        if (!size.available) {
          btn.disabled = true;
          btn.classList.add("is-disabled");
        }

        // auto-seleccionar primera talla disponible
        if (size.available && !selectedSizeId) {
          selectedSizeId = size.id;
          btn.classList.add("active");
        }

        btn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          if (!size.available) return;
          selectedSizeId = size.id;
          sizeRowEl.querySelectorAll(".pb-size-pill").forEach((b) => {
            b.classList.toggle("active", b === btn);
          });
        });

        sizeRowEl.appendChild(btn);
      });
    }

    if (typeof window.updateVariantContent === "function") {
      const original = window.updateVariantContent;

      window.updateVariantContent = function (model, variant) {
        // primero dejamos que tu código original haga lo suyo
        original(model, variant);

        // Localizar la clave que usamos para los mapas
               // La key ahora es la URL completa sin query (la misma que usamos en toModel)
        const k1 = (variant && variant.key) ? String(variant.key).split("?")[0] : "";
        let keyForLookup = k1;
        let v = KEY_TO_VARIANT.get(k1);

        if (!v) {
          const firstImg =
            (variant?.images && variant.images[0]) ||
            (window.currentImages && window.currentImages[0]) ||
            "";
          const k2 = firstImg ? String(firstImg).split("?")[0] : "";
          v = KEY_TO_VARIANT.get(k2);
          keyForLookup = k2;
        }

        // Pintar tallas para este color
        renderSizeButtons(keyForLookup);

        // Actualizar precio y estado del botón
        if (priceEl && v?.price) priceEl.textContent = v.price;

        if (v?.available) {
          atcBtnEl.disabled = false;
          atcBtnEl.textContent = "Añadir al carrito";
          atcBtnEl.style.cursor = "pointer";
          atcBtnEl.style.opacity = "1";
        } else {
          atcBtnEl.disabled = true;
          atcBtnEl.textContent = "Agotado";
          atcBtnEl.style.cursor = "not-allowed";
          atcBtnEl.style.opacity = ".6";
        }

        atcBtnEl.onclick = async (ev) => {
          ev.stopPropagation();
          if (!v?.available) return;

          const qty = Math.max(
            1,
            Math.min(
              9,
              parseInt(qtyNumEl?.textContent || "1", 10) || 1
            )
          );

          // Si hay talla seleccionada, usamos su ID; si no, el del color principal
          const variantId = selectedSizeId || v.id;

          try {
            await addToCart(variantId, qty);
            cartAddLocal(v.amount || 0, v.currency || "EUR", qty);
            updateBadgeFromState();
            showMiniCart();
            atcBtnEl.textContent = "Añadido ✓";
            setTimeout(() => {
              atcBtnEl.textContent = "Ir a pagar";
            }, 800);
          } catch (e) {
            console.error(e);
          }
        };

        atcBtnEl.ondblclick = (e) => {
          e.stopPropagation();
          goToCheckout();
        };
      };
    }

    document.addEventListener("keydown", (e) => {
      if (
        modalEl?.classList.contains("is-open") &&
        e.ctrlKey &&
        e.key.toLowerCase() === "p"
      ) {
        e.preventDefault();
        goToCheckout();
      }
    });
  }


  /* === Inyectar modelos Shopify en PB_MODELS === */
  function mergeIntoPB_MODELS(newModels){
    Object.keys(PB_MODELS).forEach(k => delete PB_MODELS[k]);
    Object.assign(PB_MODELS, newModels);
  }

  /* === Drawer Carrito (solo cambio: sin tocar estilos viejos, solo overlay blur) === */
  function injectCartStyles(){
    if (document.getElementById('pb-cart-styles')) return;
    const css = `
      body.pb-modal-open #pb-cart-dlg .pb-cart-dlg__overlay{
        backdrop-filter:none !important;
        -webkit-backdrop-filter:none !important;
      }
    `;
    const s=document.createElement('style');
    s.id='pb-cart-styles'; s.textContent=css; document.head.appendChild(s);
  }

  function buildCartShell(){
    let dlg = document.getElementById('pb-cart-dlg');
    if (dlg) return dlg;
    dlg = document.createElement('div');
    dlg.id = 'pb-cart-dlg';
    dlg.className = 'pb-cart-dlg';
    dlg.innerHTML = `
      <div class="pb-cart-dlg__overlay" data-close></div>
      <aside class="pb-cart-dlg__panel" role="dialog" aria-label="Carrito">
        <div class="pb-cart__head">
          <div class="pb-cart__title">Carrito <span id="pb-cart-count" style="opacity:.6;font-weight:700"></span></div>
          <button class="pb-cart__close" data-close aria-label="Cerrar">×</button>
        </div>
        <div class="pb-cart__list" id="pb-cart-list"></div>
        <div class="pb-cart__foot">
          <div class="pb-cart__row">
            <div style="opacity:.8">Total estimado</div>
            <div id="pb-cart-total" style="font-weight:800">—</div>
          </div>
          <button class="pb-btn pb-btn--pay" id="pb-cart-pay">Pagar</button>
          <button class="pb-btn pb-btn--shop" id="pb-cart-shop">shop</button>
        </div>
      </aside>`;
    document.body.appendChild(dlg);
    dlg.addEventListener('click', (e)=>{ if (e.target.matches('[data-close]')) closeCartPopup(); });
    document.getElementById('pb-cart-pay').onclick  = ()=> goToCheckout();
    document.getElementById('pb-cart-shop').onclick = ()=> goToCheckout();
    return dlg;
  }

  function renderCartLines(cart){
    const list = document.getElementById('pb-cart-list');
    list.innerHTML = '';
    const edges = cart?.lines?.edges || [];
    const subtotalAmt = Number(cart?.cost?.subtotalAmount?.amount || 0);
    const currency    = cart?.cost?.subtotalAmount?.currencyCode || 'EUR';

    document.getElementById('pb-cart-count').textContent = `(${edges.length})`;

    edges.forEach(({node})=>{
      const v = node?.merchandise;
      const img   = v?.image?.url || '';
      const title = (v?.product?.title || '').toUpperCase();
      const color = v?.title && v.title !== 'Default Title' ? v.title : '';
      const priceAmt = v?.price?.amount ?? node?.cost?.amountPerQuantity?.amount ?? 0;
      const priceCur = v?.price?.currencyCode ?? node?.cost?.amountPerQuantity?.currencyCode ?? 'EUR';
      const price = formatPrice(+priceAmt, priceCur);

      const row = document.createElement('div');
      row.className = 'pb-cart__item';
      row.dataset.lineId = node.id;
      row.innerHTML = `
        <div class="pb-cart__thumb"><img src="${img}" alt=""></div>
        <div>
          <div class="pb-cart__name">${title}</div>
          <div class="pb-cart__sub">${color || ''}</div>
          <div class="pb-cart__qty">
            <button class="pb-cart__btn" data-act="dec">–</button>
            <span class="pb-cart__q">${node.quantity}</span>
            <button class="pb-cart__btn" data-act="inc">+</button>
            <span class="pb-cart__trash" title="Eliminar" data-act="del">🗑️</span>
          </div>
        </div>
        <div class="pb-cart__price">${price}</div>`;
      list.appendChild(row);
    });

    document.getElementById('pb-cart-total').textContent = formatPrice(subtotalAmt, currency);

    list.onclick = async (e)=>{
      const btn  = e.target.closest('[data-act]'); if(!btn) return;
      const item = btn.closest('.pb-cart__item');  if(!item) return;
      const id   = item.dataset.lineId;
      const qEl  = item.querySelector('.pb-cart__q');
      let q = parseInt(qEl.textContent||'1',10);

      if (btn.dataset.act === 'inc') q++;
      if (btn.dataset.act === 'dec') q = Math.max(1, q-1);

      if (btn.dataset.act === 'del') {
        await gql(CART_LINES_REMOVE, { cartId, lineIds:[id] });
      } else {
        await gql(CART_LINES_UPDATE, { cartId, lines:[{ id, quantity:q }] });
      }
      const crt = await fetchCart();
      renderCartLines(crt);

      const totalQty = Number(crt?.totalQuantity || 0);
      const s = getLocalCart();
      s.qty = totalQty;
      s.subtotal = Number(crt?.cost?.subtotalAmount?.amount || 0);
      s.currency = crt?.cost?.subtotalAmount?.currencyCode || s.currency;
      setLocalCart(s);
      updateBadgeFromState();
    };
  }

  async function openCartPopup(){
    injectCartStyles();
    const dlg = buildCartShell();
    dlg.classList.add('is-open');
    const crt = await fetchCart();
    if (!crt){
      document.getElementById('pb-cart-list').innerHTML =
        `<div style="padding:24px;opacity:.7">Tu carrito está vacío.</div>`;
      document.getElementById('pb-cart-count').textContent = '(0)';
      document.getElementById('pb-cart-total').textContent = formatPrice(0,'EUR');
      return;
    }
    renderCartLines(crt);
  }
  function closeCartPopup(){
    const dlg = document.getElementById('pb-cart-dlg');
    if (dlg) dlg.classList.remove('is-open');
  }

  /* === Click icono carrito → abrir drawer === */
  function wireCartIconToPopup(){
    const triggers = Array.from(document.querySelectorAll('.pb-cart-trigger, a[href="/cart"]'));
    if (!triggers.length) return;
    triggers.forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openCartPopup();
      }, { passive:false });
      el.setAttribute('role','button');
      el.setAttribute('aria-haspopup','dialog');
      el.style.cursor = 'pointer';
    });
  }

  /* === Arranque === */
  window.addEventListener("DOMContentLoaded", async () => {
    try {
      const models = await loadAllModels();
      mergeIntoPB_MODELS(models);
      window.PB_MODELS_LOADED = true;
      if (typeof window.pbRefreshCollage === "function") {
        window.pbRefreshCollage();
      }
    } catch (err) {
      console.error("[PB] Error cargando productos Shopify:", err);
    } finally {
      wireModalBehavior();
      wireCartIconToPopup();
      updateBadgeFromState();
      console.log("[PB] Shopify (colección frontpage) + Collage + Cart listos.");
    }
  });
})();
