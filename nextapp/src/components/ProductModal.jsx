"use client";

import { useEffect } from 'react';

export default function ProductModal() {
  useEffect(() => {
    try { window.PB_MODAL_OWNER = 'react'; } catch (_) {}

    const bodyEl = document.body;
    const modalEl = document.getElementById('pbProductModal');
    const overlayEl = document.getElementById('pbModalOverlay');
    const closeBtn = document.getElementById('pbProdCloseBtn');
    if (!modalEl) return;

    const titleEl = document.getElementById('pbProdTitle');
    const priceEl = document.getElementById('pbProdPrice');
    const descEl  = document.getElementById('pbProdDesc');
    const subEl   = document.getElementById('pbProdSub');
    const colorRowEl = document.getElementById('pbColorRow');
    const colorsBlockEl = document.querySelector('.pb-prod-colors-block');
    const sizeRowEl = document.getElementById('pbSizeRow');
    const sizesBlockEl = document.querySelector('.pb-prod-sizes-block');
    const qtyBoxEl = document.getElementById('pbQtyBox');
    const qtyNumEl = document.getElementById('pbQtyNum');
    const atcBtnEl = document.getElementById('pbATCBtn');
    const relatedRowEl = document.getElementById('pbRelatedRow');

    const carouselImgEl = document.getElementById('pbCarouselImage');
    const prevArrow = document.getElementById('pbCarouselPrev');
    const nextArrow = document.getElementById('pbCarouselNext');

    const clamp = (x, min, max) => Math.min(max, Math.max(min, x));
    const basename = (p)=> (p||'').split('/').pop();
    const applyAlias = (name)=> name;
    const fixAssetUrl = (u)=>{ if(!u) return u; const b = basename(u); return u.replace(/[^/]*$/, b); };

    let activeModelId = null;
    let activeVariantIndex = 0;
    let selectedSizeId = null;
    let currentImages = [];
    let currentImageIndex = 0;

    function renderCarouselImage(){
      if (!currentImages.length || !carouselImgEl) return;
      const url = fixAssetUrl(currentImages[currentImageIndex]);
      carouselImgEl.style.opacity = '0';
      carouselImgEl.style.transform = 'scale(.96)';
      setTimeout(() => {
        carouselImgEl.src = url;
        carouselImgEl.alt = titleEl?.textContent || 'Producto';
        carouselImgEl.style.opacity = '1';
        carouselImgEl.style.transform = 'scale(1)';
      }, 100);
    }
    function goPrevImg(){ if (!currentImages.length) return; currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length; renderCarouselImage(); }
    function goNextImg(){ if (!currentImages.length) return; currentImageIndex = (currentImageIndex + 1) % currentImages.length; renderCarouselImage(); }
    prevArrow && prevArrow.addEventListener('click', goPrevImg);
    nextArrow && nextArrow.addEventListener('click', goNextImg);

    function renderMedia(images){ currentImages = images || []; currentImageIndex = 0; renderCarouselImage(); }

    // Legacy base updater
    function baseUpdateVariantContent(model, variant){
      const fullTitle = variant.colorLabel ? `${model.title} (${variant.colorLabel})` : model.title;
      if (titleEl) titleEl.textContent = fullTitle;
      if (priceEl) priceEl.textContent = variant.price || '';
      if (subEl)   subEl.textContent   = variant.colorLabel ? String(variant.colorLabel) : '';
      if (descEl)  descEl.textContent  = variant.desc  || '';
      if (qtyNumEl) qtyNumEl.textContent = '1';
      if (atcBtnEl){ atcBtnEl.disabled = true; atcBtnEl.textContent = 'Agotado'; atcBtnEl.style.cursor = 'not-allowed'; atcBtnEl.style.opacity = '.6'; }
      renderMedia(Array.isArray(variant.images) ? variant.images.map(fixAssetUrl) : []);
      renderRelated(variant.key);
    }

    function buildColorPills(model){
      if (!colorRowEl || !colorsBlockEl) return;
      colorRowEl.innerHTML = '';
      const hasRealColors = (model.variants||[]).length > 1 || (model.variants||[]).some(v=> v.colorLabel && v.colorLabel.trim()!=='');
      if (!hasRealColors){ colorsBlockEl.style.display='none'; return; }
      colorsBlockEl.style.display='grid';
      (model.variants||[]).forEach((v,i)=>{
        const pill = document.createElement('button');
        pill.className = 'pb-color-pill' + (i===activeVariantIndex?' active':'');
        pill.textContent = v.colorLabel || ('Color '+(i+1));
        pill.addEventListener('click', (ev)=>{
          ev.stopPropagation(); if (activeVariantIndex===i) return;
          const prevScroll = modalEl.scrollTop;
          activeVariantIndex = i;
          if (typeof window.updateVariantContent === 'function') window.updateVariantContent(model, model.variants[i]);
          Array.from(colorRowEl.children).forEach((btn, idx)=>{ btn.classList.toggle('active', idx===activeVariantIndex); });
          modalEl.scrollTop = prevScroll;
        });
        colorRowEl.appendChild(pill);
      });
    }

    function buildSizePillsByKey(cdnKey){
      if (!sizeRowEl) return;
      sizeRowEl.innerHTML = '';
      const sizes = (window.KEY_TO_SIZES && window.KEY_TO_SIZES.get(cdnKey)) || [];
      const hide = !sizes.length;
      if (sizesBlockEl) sizesBlockEl.style.display = hide ? 'none' : '';
      sizeRowEl.style.display = hide ? 'none' : '';
      if (hide){ selectedSizeId = null; return; }
      selectedSizeId = null;
      sizes.forEach((s)=>{
        const pill = document.createElement('button'); pill.className = 'pb-size-pill'; pill.textContent = s.label || '';
        if (!s.available){ pill.disabled = true; pill.classList.add('is-disabled'); }
        if (s.available && !selectedSizeId){ selectedSizeId = s.id; pill.classList.add('active'); }
        pill.addEventListener('click', (ev)=>{ ev.stopPropagation(); if (!s.available) return; selectedSizeId = s.id; Array.from(sizeRowEl.children).forEach(b=> b.classList.remove('active')); pill.classList.add('active'); });
        sizeRowEl.appendChild(pill);
      });
    }

    function renderRelated(currentVariantKey){
      if (!relatedRowEl) return;
      const relKeys = getRelatedKeys(currentVariantKey);
      relatedRowEl.innerHTML = '';
      relKeys.forEach((vKey)=>{
        const match = findModelByVariantKey(vKey); if (!match) return; const { modelId, model, variantIndex } = match;
        const variant = model.variants[variantIndex];
        const firstImg = (variant.images && variant.images[0]) ? fixAssetUrl(variant.images[0]) : '';
        const card = document.createElement('button'); card.type='button'; card.className='pb-related-card';
        card.innerHTML = `<div class=\"pb-related-imgwrap\"><img src=\"${firstImg}\" alt=\"${model.title}\"></div><div style=\"color:#fff;font-weight:700;font-size:12px;line-height:1.3;\">${model.title}</div><div style=\"opacity:.7;font-size:12px;\">${variant.price || ''}</div><div class=\"pb-related-chip\">${variant.soldOut ? 'Agotado' : 'Disponible'}</div>`;
        card.addEventListener('click', (ev)=>{ ev.stopPropagation(); openProductModalByModelAndVariant(modelId, variantIndex); });
        relatedRowEl.appendChild(card);
      });
    }

    function findModelByVariantKey(variantKey){
      const key = applyAlias(basename(variantKey||''));
      const PB_MODELS = window.PB_MODELS || {};
      for (const modelId in PB_MODELS){ const model = PB_MODELS[modelId]; const idx = (model.variants||[]).findIndex(v => applyAlias(basename(v.key)) === key); if (idx !== -1) return { modelId, model, variantIndex: idx }; }
      return null;
    }
    function getRelatedKeys(currentVariantKey){
      const current = applyAlias(basename(currentVariantKey||''));
      const PB_MODELS = window.PB_MODELS || {};
      const allKeys = new Set();
      for (const m of Object.values(PB_MODELS)){ for (const v of (m.variants||[])){ const k = applyAlias(basename(v.key||'')); if (k && k !== current) allKeys.add(k); } }
      const arr = Array.from(allKeys); for (let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
      return arr.slice(0,5);
    }

    function openProductModalByModelAndVariant(modelId, variantIndex){
      const PB_MODELS = window.PB_MODELS || {};
      const model = PB_MODELS[modelId]; if (!model) return;
      activeModelId = modelId; activeVariantIndex = Number(variantIndex)||0;
      const variant = model.variants[activeVariantIndex];
      buildColorPills(model);
      if (typeof window.updateVariantContent === 'function') window.updateVariantContent(model, variant);
      modalEl.classList.add('is-open'); modalEl.setAttribute('aria-hidden','false'); bodyEl.classList.add('pb-modal-open'); modalEl.scrollTop = 0;
    }
    function openProductModalFromCollage(variantKey, imgURL){
      const match = findModelByVariantKey(variantKey);
      if (match){ openProductModalByModelAndVariant(match.modelId, match.variantIndex); return; }
      activeModelId = null; activeVariantIndex = 0;
      const fallbackModel = { title: applyAlias(basename(variantKey)).replace(/\.(png|webp|jpg|jpeg)$/i,'').replace(/[_-]+/g,' ').trim(), variants:[{ colorLabel:'', key: applyAlias(basename(variantKey)), price:'', desc:'', images:[imgURL], soldOut:true }] };
      buildColorPills(fallbackModel);
      if (typeof window.updateVariantContent === 'function') window.updateVariantContent(fallbackModel, fallbackModel.variants[0]);
      modalEl.classList.add('is-open'); modalEl.setAttribute('aria-hidden','false'); bodyEl.classList.add('pb-modal-open'); modalEl.scrollTop = 0;
    }
    function closeProductModal(){ modalEl.classList.remove('is-open'); modalEl.setAttribute('aria-hidden','true'); bodyEl.classList.remove('pb-modal-open'); }

    const onCloseClick = (ev)=>{ ev.stopPropagation(); closeProductModal(); };
    const onOverlayClick = ()=> closeProductModal();
    const onEsc = (e)=>{ if (e.key === 'Escape') closeProductModal(); };
    closeBtn && closeBtn.addEventListener('click', onCloseClick);
    overlayEl && overlayEl.addEventListener('click', onOverlayClick);
    document.addEventListener('keydown', onEsc);
    const onQty = (e)=>{ const btn = e.target.closest('.pb-qty-btn'); if(!btn) return; e.stopPropagation(); let qty = parseInt(qtyNumEl?.textContent||'1',10); const delta = parseInt(btn.dataset.delta||'0',10); qty = clamp(qty+delta,1,9); if(qtyNumEl) qtyNumEl.textContent=String(qty); };
    qtyBoxEl && qtyBoxEl.addEventListener('click', onQty);

    window.openProductModalByModelAndVariant = openProductModalByModelAndVariant;
    window.openProductModalFromCollage = openProductModalFromCollage;

    window.updateVariantContent = function(model, variant){
      baseUpdateVariantContent(model, variant);
      const keyRaw = (variant?.key || (variant?.images && variant.images[0]) || '') || '';
      const cdnKey = String(keyRaw).split('?')[0];
      buildSizePillsByKey(cdnKey);
      const vPayload = (window.KEY_TO_VARIANT && window.KEY_TO_VARIANT.get(cdnKey)) || null;
      if (priceEl && vPayload?.price) priceEl.textContent = vPayload.price;
      if (atcBtnEl){
        const available = vPayload ? vPayload.available : !variant.soldOut;
        atcBtnEl.disabled = !available; atcBtnEl.textContent = available ? 'Añadir al carrito' : 'Agotado';
        atcBtnEl.style.cursor = available ? 'pointer' : 'not-allowed'; atcBtnEl.style.opacity = available ? '1' : '.6';
        atcBtnEl.onclick = async (ev)=>{ ev.stopPropagation(); if (!available) return; const qty = Math.max(1, Math.min(9, parseInt(qtyNumEl?.textContent||'1',10) || 1)); const variantId = selectedSizeId || (vPayload && vPayload.id); if (variantId && typeof window.cartAdd === 'function') await window.cartAdd(variantId, qty); };
        atcBtnEl.ondblclick = (e)=>{ e.stopPropagation(); if (typeof window.openCartPopup === 'function') window.openCartPopup(); };
      }
    };

    return () => {
      closeBtn && closeBtn.removeEventListener('click', onCloseClick);
      overlayEl && overlayEl.removeEventListener('click', onOverlayClick);
      document.removeEventListener('keydown', onEsc);
      qtyBoxEl && qtyBoxEl.removeEventListener('click', onQty);
      prevArrow && prevArrow.removeEventListener('click', goPrevImg);
      nextArrow && nextArrow.removeEventListener('click', goNextImg);
    };
  }, []);

  return (
    <div id="pbProductModal" aria-hidden="true">
      <div className="pb-modal-overlay" id="pbModalOverlay" aria-hidden="true"></div>

      <div className="pb-product-modal-card" role="dialog" aria-modal="true" aria-labelledby="pbProdTitle">
        <button className="pb-prod-close-btn" id="pbProdCloseBtn" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>

        <section className="pb-prod-main">
          <div className="pb-prod-gallery">
            <div className="pb-prod-carousel-frame">
              <button className="pb-carousel-arrow pb-carousel-arrow--prev" id="pbCarouselPrev" aria-label="Anterior"><img className="flechacarrusel" src="/icon/flechaizquierda.png" alt="" /></button>
              <img id="pbCarouselImage" className="pb-prod-carousel-image" alt="Producto" />
              <button className="pb-carousel-arrow pb-carousel-arrow--next" id="pbCarouselNext" aria-label="Siguiente"><img className="flechacarrusel" src="/icon/flechaderecha.png" alt="" /></button>
            </div>
          </div>

          <div className="pb-prod-details">
            <div>
              <div className="pb-brand">PÓRTATE BIEN</div>
              <h2 className="pb-prod-title" id="pbProdTitle"></h2>
              <div className="pb-prod-price" id="pbProdPrice"></div>
              <div className="pb-prod-sub" id="pbProdSub"></div>
            </div>

            <div className="pb-prod-colors-block">
              <div className="pb-prod-label">Color</div>
              <div className="pb-colors-row" id="pbColorRow"></div>
            </div>

            <div className="pb-prod-sizes-block">
              <div className="pb-prod-label">Talla</div>
              <div className="pb-sizes-row" id="pbSizeRow"></div>
            </div>

            <div className="pb-purchase-row">
              <div className="pb-qty-box" id="pbQtyBox">
                <button className="pb-qty-btn" data-delta="-1">−</button>
                <div className="pb-qty-num" id="pbQtyNum">1</div>
                <button className="pb-qty-btn" data-delta="1">+</button>
              </div>
              <button className="pb-atc-btn" id="pbATCBtn" disabled>Agotado</button>
            </div>

            <div className="pb-prod-desc" id="pbProdDesc"></div>
          </div>
        </section>

        <aside className="pb-related-block">
          <div className="pb-related-title"><span>You may also like</span></div>
          <div className="pb-related-row" id="pbRelatedRow"></div>
        </aside>
      </div>
    </div>
  );
}

