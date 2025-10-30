 
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

    /* Archivos en /fotoscatalogoweb/ */
    const FILES = [
      "../public/fotoscatalogoweb/camisetagafasblanca.png",
      "../public/fotoscatalogoweb/camisetagafasnegra.png",
      "../public/fotoscatalogoweb/camisetapatronazul.png",
      "../public/fotoscatalogoweb/bufandacamuflaje.png","../public/fotoscatalogoweb/bufandanegra.png","../public/fotoscatalogoweb/bufandaroja.png",
      "../public/fotoscatalogoweb/camisetacaptura.png","../public/fotoscatalogoweb/camisetapatronrojo.png","../public/fotoscatalogoweb/camsietapatronrojo.png",
      "../public/fotoscatalogoweb/gorra.png","../public/fotoscatalogoweb/polorojo.png","../public/fotoscatalogoweb/poloverde.png",
      "../public/fotoscatalogoweb/sudaderaseñalesazul.png","../public/fotoscatalogoweb/sudaderaseñalesnegra.png"
    ];

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
    function exists(url){
      return new Promise(res=>{
        const i=new Image();
        i.onload=()=>res(true);
        i.onerror=()=>res(false);
        i.src=url;
      });
    }
    async function pickPath(baseName){
      const u1="/fotoscatalogoweb/"+encodeURI(baseName);
      const u2=u1.replace(/\.png$/i,".webp");
      const u3=u1.replace(/\.webp$/i,".png");
      if(await exists(u1)) return u1;
      if(await exists(u2)) return u2;
      if(await exists(u3)) return u3;
      return null;
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











    /* ============== COLLAGE RENDER ============== */
    (async function(){
      const $collage = document.getElementById('collage');
      const $hero = document.getElementById('hero');

      async function render(){
        const seed = CONFIG.seed ?? getSeed();
        const rnd  = mulberry32(seed);

        const names = shuffle([...FILES], rnd);
        const items = [];
        for (const base of names){
          const url = await pickPath(base);
          if (url) items.push({ base, url });
        }

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

            if (it.base === 'gorra.png') sc *= 0.90;

            const fig = document.createElement('figure');
            fig.className = 'piece';
            fig.style.left = `${ax}px`;
            fig.style.top  = `${ay}px`;
            fig.style.setProperty('--rot', rot);
            fig.style.setProperty('--sc',  sc.toFixed(3));
            fig.style.setProperty('--tx',  '0px');
            fig.style.setProperty('--ty',  '0px');
            fig.style.setProperty('--z',   z);

            const img = document.createElement('img');
            img.alt = it.base.replace(/\.(png|webp|jpg|jpeg)$/i,'');
            img.loading = 'lazy';
            img.decoding = 'async';
            img.src = it.url;

            let w = clamp(cellW * (0.88 + rnd()*0.18), 100, 380);
            if (it.base === 'gorra.png') w *= 0.90;

            img.style.setProperty('--w', Math.round(w) + 'px');

            fig.appendChild(img);
            $collage.appendChild(fig);
          }
        }
      }

      window.addEventListener('load', render, { once:true });
      addEventListener('resize', () => render(), { passive:true });
      addEventListener('orientationchange', () => setTimeout(render, 120), { passive:true });
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
      { src:"/assets/videos/nostoi.mp4" },
      { src:"/assets/videos/blow%20ne.mp4" },
      { src:"/assets/videos/callaito.mp4" },
      { src:"/assets/videos/jim.mp4" },
      { src:"/assets/videos/keef.mp4" },
      { src:"/assets/videos/marlo.mp4" },
      { src:"/assets/videos/moneyspread.mp4" },
      { src:"/assets/videos/360.mp4" },
      { src:"/assets/videos/perrabb.mp4" },
      { src:"/assets/videos/sonrie.mp4" },
      { src:"/assets/videos/teniafe.mp4" },
      { src:"/assets/videos/toymb.mp4" },
      { src:"/assets/videos/yeat.mp4" }
    ];

    // iPod video player (prev/next + play/pause)
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

      /* Ajuste relación pantalla al video */
      const ipodScreen = document.querySelector('.ipod-screen');
      video.addEventListener('loadedmetadata', ()=>{
        const w = video.videoWidth || 4;
        const h = video.videoHeight || 3;
        ipodScreen.style.aspectRatio = `${w} / ${h}`;
      });

      /* ALEATORIO con "bolsa" + historial */
      let history = [];
      let bag = [];
      function shuffle(a){
        for (let j=a.length-1; j>0; j--){
          const k = Math.floor(Math.random()*(j+1));
          [a[j], a[k]] = [a[k], a[j]];
        }
        return a;
      }
      function refillBag(excludeIndex){
        const candidates = [...Array(VIDEOS.length).keys()].filter(idx => idx !== excludeIndex);
        bag = shuffle(candidates);
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

      // gesto circular tipo clickwheel
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

      // microinteracciones desktop
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
     DATA DE PRODUCTO: MODELOS + VARIANTES
     =========================================================== */
  const PB_MODELS = {
    "facetime-tshirt": {
      title: "FACETIME T-SHIRT",
      variants: [
        {
          colorLabel: "Negro",
          key: "camisetagafasnegra.png",
          price: "€35,00",
          desc: "Camiseta pesada 100% algodón.\nPrint en blanco.\nFit ligeramente oversized.",
          images: [
            "/fotoscatalogoweb/camisetagafasnegra.png",
            "/fotoscatalogoweb/camisetagafasnegra.png",
            "/fotoscatalogoweb/camisetagafasnegra.png",
            "/fotoscatalogoweb/camisetagafasnegra.png"
          ],
          soldOut: true
        },
        {
          colorLabel: "Blanco",
          key: "camisetagafasblanca.png",
          price: "€35,00",
          desc: "Camiseta unisex 100% algodón.\nGráfico frontal tipo FACETIME.\nEdición limitada 'Pórtate Bien'.",
          images: [
            "/fotoscatalogoweb/camisetagafasblanca.png",
            "/fotoscatalogoweb/camisetagafasblanca.png",
            "/fotoscatalogoweb/camisetagafasblanca.png",
            "/fotoscatalogoweb/camisetagagafasblanca.png"
          ],
          soldOut: true
        }
      ]
    },

    "pb-hoodie": {
      title: "Pórtate Bien Hoodie",
      variants: [
        {
          colorLabel: "Negro",
          key: "sudaderaseñalesnegra.png",
          price: "€65,00",
          desc: "Sudadera 400gsm French Terry.\nSerigrafía frontal 'Pórtate Bien'.\nCorte relajado. Calidad premium.",
          images: [
            "/fotoscatalogoweb/sudaderaseñalesnegra.png",
            "/fotoscatalogoweb/sudaderaseñalesnegra.png",
            "/fotoscatalogoweb/sudaderaseñalesnegra.png",
            "/fotoscatalogoweb/sudaderaseñalesnegra.png"
          ],
          soldOut: true
        },
        {
          colorLabel: "Azul",
          key: "sudaderaseñalesazul.png",
          price: "€65,00",
          desc: "Sudadera 400gsm French Terry.\nVersión azul señales 'Pórtate Bien'.\nCorte relajado. Calidad premium.",
          images: [
            "/fotoscatalogoweb/sudaderaseñalesazul.png",
            "/fotoscatalogoweb/sudaderaseñalesazul.png",
            "/fotoscatalogoweb/sudaderaseñalesazul.png",
            "/fotoscatalogoweb/sudaderaseñalesazul.png"
          ],
          soldOut: true
        }
      ]
    },

    "pb-hat": {
      title: "PB HAT",
      variants: [
        {
          colorLabel: "Negro",
          key: "gorra.png",
          price: "€30,00",
          desc: "Gorra ajustable con bordado rojo 'PÓRTATE BIEN'. Low profile clásica.",
          images: [
            "/fotoscatalogoweb/gorra.png",
            "/fotoscatalogoweb/gorra.png",
            "/fotoscatalogoweb/gorra.png",
            "/fotoscatalogoweb/gorra.png"
          ],
          soldOut: true
        }
      ]
    },

    "pb-scarf": {
      title: "PB SCARF",
      variants: [
        {
          colorLabel: "Camuflaje",
          key: "bufandacamuflaje.png",
          price: "€28,00",
          desc: "Bufanda jacquard patrón PB camuflaje.",
          images: [
            "/fotoscatalogoweb/bufandacamuflaje.png",
            "/fotoscatalogoweb/bufandacamuflaje.png",
            "/fotoscatalogoweb/bufandacamuflaje.png",
            "/fotoscatalogoweb/bufandacamuflaje.png"
          ],
          soldOut: true
        },
        {
          colorLabel: "Negra",
          key: "bufandanegra.png",
          price: "€28,00",
          desc: "Bufanda jacquard PB negra.",
          images: [
            "/fotoscatalogoweb/bufandanegra.png",
            "/fotoscatalogoweb/bufandanegra.png",
            "/fotoscatalogoweb/bufandanegra.png",
            "/fotoscatalogoweb/bufandanegra.png"
          ],
          soldOut: true
        },
        {
          colorLabel: "Roja",
          key: "bufandaroja.png",
          price: "€28,00",
          desc: "Bufanda jacquard PB roja.",
          images: [
            "/fotoscatalogoweb/bufandaroja.png",
            "/fotoscatalogoweb/bufandaroja.png",
            "/fotoscatalogoweb/bufandaroja.png",
            "/fotoscatalogoweb/bufandaroja.png"
          ],
          soldOut: true
        }
      ]
    },

    "please-behave-polo": {
      title: "Please Behave Polo",
      variants: [
        {
          colorLabel: "Rojo/Azul",
          key: "polorojo.png",
          price: "€55,00",
          desc: "Polo bordado 'Please Behave'. Bloques rojo/azul. Tejido grueso, cuello contraste.",
          images: [
            "/fotoscatalogoweb/polorojo.png",
            "/fotoscatalogoweb/polorojo.png",
            "/fotoscatalogoweb/polorojo.png",
            "/fotoscatalogoweb/polorojo.png"
          ],
          soldOut: true
        },
        {
          colorLabel: "Verde",
          key: "poloverde.png",
          price: "€55,00",
          desc: "Polo bordado 'Please Behave'. Versión verde. Tejido grueso, cuello contraste.",
          images: [
            "/fotoscatalogoweb/poloverde.png",
            "/fotoscatalogoweb/poloverde.png",
            "/fotoscatalogoweb/poloverde.png",
            "/fotoscatalogoweb/poloverde.png"
          ],
          soldOut: true
        }
      ]
    }
  };

  /* ===========================================================
     HELPERS
     =========================================================== */
  function findModelByVariantKey(variantKey){
    for (const modelId in PB_MODELS){
      const model = PB_MODELS[modelId];
      const idx = model.variants.findIndex(v => v.key === variantKey);
      if (idx !== -1){
        return { modelId, model, variantIndex: idx };
      }
    }
    return null;
  }

  function getRelatedKeys(currentVariantKey){
    if (!Array.isArray(FILES)) return [];

    const allKeys = [];
    for (const m of Object.values(PB_MODELS)){
      for (const v of m.variants){
        allKeys.push(v.key);
      }
    }

    const pool = FILES.filter(name => name !== currentVariantKey && allKeys.includes(name));

    for (let i=pool.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [pool[i],pool[j]]=[pool[j],pool[i]];
    }

    // 5 tarjetas en "You may also like"
    return pool.slice(0,5);
  }

  /* ===========================================================
     DOM REFS
     =========================================================== */
  const bodyEl        = document.body;
  const modalEl       = document.getElementById('pbProductModal');
  const overlayEl     = document.getElementById('pbModalOverlay'); // blur clicable
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

  // tarjeta completa del modal
  const cardEl = document.querySelector('.pb-product-modal-card');

  // si haces click en el área vacía/padding de la tarjeta (que visualmente se ve como blur),
  // cerramos el modal. si haces click en botones, imágenes, etc., no se cierra.
  cardEl.addEventListener('click', function(ev){
    if (ev.target === cardEl) {
      closeProductModal();
    }
  });

  /* ===========================================================
     STATE
     =========================================================== */
  let activeModelId = null;
  let activeVariantIndex = 0;

  let currentImages = [];
  let currentImageIndex = 0;

  /* ===========================================================
     RENDER CAROUSEL
     =========================================================== */
  function renderCarouselImage(){
    if(!currentImages.length) return;
    const url = currentImages[currentImageIndex];

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
     BUILD COLOR PILLS (una vez por modelo al abrir)
     =========================================================== */
  function buildColorPills(model){
    colorRowEl.innerHTML = "";

    const hasRealColors = (
      model.variants.length > 1 ||
      model.variants.some(v => v.colorLabel && v.colorLabel.trim()!=="")
    );
    if (!hasRealColors){
      colorsBlockEl.style.display = "none";
      return;
    }

    colorsBlockEl.style.display = "grid";

    model.variants.forEach((v,i)=>{
      const pill = document.createElement('button');
      pill.className = "pb-color-pill" + (i===activeVariantIndex ? " active" : "");
      pill.textContent = v.colorLabel || ("Color "+(i+1));

      pill.addEventListener('click', (ev)=>{
        // evita que un click en el botón de color cierre el modal por burbujeo accidental
        ev.stopPropagation();

        if (activeVariantIndex === i) return;

        // guardamos scroll interno antes de cambiar contenido
        const prevScroll = modalEl.scrollTop;

        activeVariantIndex = i;
        updateVariantContent(model, model.variants[i]); // actualiza contenido visual

        // actualizar aspecto de pills sin reconstruirlas todas
        Array.from(colorRowEl.children).forEach((btn,idx)=>{
          if (idx === activeVariantIndex){
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });

        // restaurar scroll del modal para que no "te saque"
        modalEl.scrollTop = prevScroll;
      });

      colorRowEl.appendChild(pill);
    });
  }

  /* ===========================================================
     ACTUALIZAR SOLO CONTENIDO (para cambios de color sin saltos)
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

    currentImages = Array.isArray(variant.images) ? variant.images.slice() : [];
    currentImageIndex = 0;

    // sin miniaturas: solo pintamos la imagen principal
    renderCarouselImage();

    renderRelated(variant.key);
  }

  /* ===========================================================
     RENDER VARIANTE (usado al abrir modal por primera vez)
     =========================================================== */
  function renderVariant(model, variant){
    // construimos pills de color una única vez con el modelo actual
    buildColorPills(model);

    // pintamos el contenido inicial
    updateVariantContent(model, variant);
  }

  /* ===========================================================
     RENDER RECOMENDADOS
     =========================================================== */
  function renderRelated(currentVariantKey){
    const relKeys = getRelatedKeys(currentVariantKey);
    relatedRowEl.innerHTML = "";

    relKeys.forEach(vKey=>{
      const match = findModelByVariantKey(vKey);
      if(!match) return;

      const { modelId, model, variantIndex } = match;
      const variant = model.variants[variantIndex];
      const firstImg = (variant.images && variant.images[0]) ? variant.images[0] : "";

      const card = document.createElement('button');
      card.type = "button";
      card.className = "pb-related-card";
      card.innerHTML = `
        <div class="pb-related-imgwrap">
          <img src="${firstImg}" alt="${model.title}">
        </div>
        <div style="color:#fff; font-weight:700; font-size:12px; line-height:1.3;">${model.title}</div>
        <div style="opacity:.7; font-size:12px;">${variant.price || ""}</div>
        <div class="pb-related-chip">Agotado</div>
      `;

      card.addEventListener('click', (ev)=>{
        ev.stopPropagation(); // no cerrar modal por seguridad
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

    // bloquea scroll del fondo
    bodyEl.classList.add('pb-modal-open');

    // sube al principio del modal
    modalEl.scrollTop = 0;
  }

  function openProductModalFromCollage(variantKey, imgURL){
    const match = findModelByVariantKey(variantKey);

    if (match){
      openProductModalByModelAndVariant(match.modelId, match.variantIndex);
      return;
    }

    // fallback si no está en PB_MODELS
    activeModelId = null;
    activeVariantIndex = 0;

    const fallbackModel = {
      title: variantKey
        .replace(/\.(png|webp|jpg|jpeg)$/i,"")
        .replace(/[_-]+/g," ")
        .trim(),
      variants: [
        {
          colorLabel: "",
          key: variantKey,
          price: "",
          desc: "",
          images: [ imgURL ],
          soldOut: true
        }
      ]
    };

    // en fallback solo hay una variante, pero mantenemos la misma lógica
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

  // botón cerrar oculto (por si en algún momento lo activas visualmente)
  closeBtn.addEventListener('click', (ev)=>{
    ev.stopPropagation();
    closeProductModal();
  });

  /* CLIC EN EL BLUR = CERRAR (clicar en el área difuminada SIEMPRE cierra) */
  overlayEl.addEventListener('click', (ev)=>{
    closeProductModal();
  });

  /* tecla ESC */
  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape'){
      closeProductModal();
    }
  });

  /* ===========================================================
     CLICK GLOBAL FUERA DEL MODAL
     (cierra al clicar fuera de .pb-product-modal-card,
      pero NO cierra al clicar en el card, ni en el iPod)
     =========================================================== */
  const musicDrawerEl = document.getElementById('musicDrawer');

  document.addEventListener('click', function(e){
    if (!modalEl.classList.contains('is-open')) return;

    const clickTarget = e.target;

    // si clicas dentro del contenido del modal, NO cerrar
    if (cardEl.contains(clickTarget)) {
      return;
    }

    // si clicas en el drawer/iPod, NO cerrar
    if (musicDrawerEl && musicDrawerEl.contains(clickTarget)) {
      return;
    }

    // en cualquier otro sitio, cerrar
    closeProductModal();
  }, true); // captura

  /* ===========================================================
     QTY +/-
     =========================================================== */
  qtyBoxEl.addEventListener('click', e=>{
    const btn = e.target.closest('.pb-qty-btn');
    if(!btn) return;
    e.stopPropagation(); // no cerrar el modal por seguridad
    let qty = parseInt(qtyNumEl.textContent || "1",10);
    const delta = parseInt(btn.dataset.delta || "0",10);
    qty += delta;
    if(qty < 1) qty = 1;
    if(qty > 9) qty = 9;
    qtyNumEl.textContent = String(qty);
  });

  /* ===========================================================
     CLICK EN EL COLLAGE
     =========================================================== */
  collageEl.addEventListener('click', e=>{
    const piece = e.target.closest('.piece');
    if(!piece) return;
    const img = piece.querySelector('img');
    if(!img) return;

    const srcURL   = img.getAttribute('src') || "";
    const baseName = srcURL.split('/').pop();

    openProductModalFromCollage(baseName, srcURL);
  });
