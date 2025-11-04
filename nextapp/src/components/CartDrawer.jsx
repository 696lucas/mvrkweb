"use client";

import { useEffect, useRef, useState } from "react";

// Minimal Shopify Storefront client
const SHOPIFY_DOMAIN = "qhzkkr-2d.myshopify.com";
const STOREFRONT_TOKEN = "b919997de07b4172affb1803d79a6509";
const API_URL = `https://${SHOPIFY_DOMAIN}/api/2025-01/graphql.json`;

async function gql(query, variables = {}) {
  const r = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) console.error(j.errors);
  return j.data;
}

const CART_CREATE = `mutation($lines:[CartLineInput!]){ cartCreate(input:{ lines:$lines }){ cart{ id checkoutUrl } userErrors{ field message } } }`;
const CART_QUERY = `query($id:ID!){ cart(id:$id){ id checkoutUrl totalQuantity cost{ subtotalAmount{ amount currencyCode } } lines(first:100){ edges{ node{ id quantity cost{ amountPerQuantity{ amount currencyCode } } merchandise{ ... on ProductVariant{ id title availableForSale image{ url } price{ amount currencyCode } product{ title } } } } } } } }`;
const CART_LINES_ADD = `mutation($cartId:ID!,$lines:[CartLineInput!]!){ cartLinesAdd(cartId:$cartId, lines:$lines){ cart{ id } userErrors{ field message } } }`;
const CART_LINES_UPDATE = `mutation($cartId:ID!,$lines:[CartLineUpdateInput!]!){ cartLinesUpdate(cartId:$cartId, lines:$lines){ cart{ id } userErrors{ field message } } }`;
const CART_LINES_REMOVE = `mutation($cartId:ID!,$lineIds:[ID!]!){ cartLinesRemove(cartId:$cartId, lineIds:$lineIds){ cart{ id } userErrors{ field message } } }`;

function formatPrice(amt, cur = "EUR") {
  try { return new Intl.NumberFormat("es-ES", { style: "currency", currency: cur }).format(Number(amt ?? 0)); }
  catch { return `${amt} ${cur}`; }
}

function getCartState() {
  try { return JSON.parse(sessionStorage.getItem("pb_cart") || "{}"); } catch { return {}; }
}
function setCartState(s) {
  try { sessionStorage.setItem("pb_cart", JSON.stringify(s)); } catch {}
}

// Badge/minicart helpers (legacy‑like)
function ensureBadge(){
  const icon = document.querySelector('.pb-cart-trigger') || document.querySelector('a[href="/cart"]');
  if (!icon) return null;
  icon.style.position = 'relative';
  let b = icon.querySelector('.pb-cart-badge');
  if (!b){ b = document.createElement('span'); b.className = 'pb-cart-badge'; icon.appendChild(b); }
  return b;
}
function updateBadgeFromState(){
  const s = getCartState();
  const b = ensureBadge(); if (!b) return;
  const q = Number(s.qty||0);
  b.textContent = String(q);
  b.style.display = q ? 'inline-flex' : 'none';
}

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState(null);
  const cartIdRef = useRef(null);

  useEffect(() => {
    // Inject styles aligned to legacy class names
    const css = `
    #pb-cart-dlg{ position:fixed; inset:0; z-index:100000; display:none; }
    #pb-cart-dlg.is-open{ display:block; }
    .pb-cart-dlg__overlay{ position:absolute; inset:0; background:rgba(0,0,0,.40); backdrop-filter: blur(1px); }
    .pb-cart-dlg__panel{ position:absolute; right:0; top:0; bottom:0; width:min(90vw, 340px); background:#fff; color:#111; display:flex; flex-direction:column; box-shadow: -10px 0 28px rgba(0,0,0,.35); }
    .pb-cart__head{ padding:16px 18px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,.08); font-weight:700; }
    .pb-cart__list{ flex:1; overflow:auto; padding:8px 12px; }
    .pb-cart__item{ display:flex; gap:12px; align-items:center; padding:10px 6px; border-bottom:1px solid rgba(0,0,0,.06); }
    .pb-cart__thumb{ width:64px; height:64px; background:#f3f3f3; border-radius:6px; overflow:hidden; display:grid; place-items:center; }
    .pb-cart__thumb img{ width:100%; height:100%; object-fit:cover; }
    .pb-cart__name{ font-size:13px; font-weight:700; }
    .pb-cart__sub{ font-size:12px; opacity:.8; }
    .pb-cart__qty{ display:flex; align-items:center; gap:8px; margin-top:6px; }
    .pb-cart__btn{ background:#efefef; color:#111; border:none; width:26px; height:26px; border-radius:6px; cursor:pointer; }
    .pb-cart__trash{ margin-left:8px; cursor:pointer; opacity:.7; }
    .pb-cart__price{ margin-left:auto; font-weight:700; color:#111; }
    .pb-cart__foot{ padding:14px 16px; border-top:1px solid rgba(0,0,0,.08); background:#fff; }
    .pb-cart__row{ display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
    .pb-btn{ border:none; border-radius:8px; padding:10px 12px; font-weight:700; cursor:pointer; }
    .pb-btn--pay{ background:#111; color:#fff; width:100%; margin-top:8px; }
    .pb-btn--shop{ background:#efefef; color:#111; width:100%; margin-top:8px; }
    .pb-cart-badge{ position:absolute; right:-6px; top:-6px; background:#fff; color:#111; border-radius:999px; min-width:18px; height:18px; display:none; align-items:center; justify-content:center; font:700 11px/1 system-ui }
    .pb-minicart{ position:absolute; z-index:10000; min-width:300px; background:#111; color:#fff; border-radius:10px; padding:12px; box-shadow:0 10px 28px rgba(0,0,0,.4); opacity:0; transform:translateY(-6px); transition:opacity .18s ease, transform .18s ease; }
    .pb-minicart.is-open{ opacity:1; transform:translateY(0); }
    .pb-minicart__title{ font:700 14px/1.2 system-ui; margin-bottom:6px; }
    .pb-minicart__row{ display:flex; align-items:center; justify-content:space-between; font:500 13px/1.2 system-ui; padding:4px 0; }
    .pb-minicart__actions{ display:flex; gap:8px; margin-top:10px; }
    .pb-minicart .pb-btn{ flex:1; }
    .pb-minicart .pb-btn--primary{ background:#fff; color:#111; }
    `;
    const style = document.createElement("style");
    style.setAttribute("data-pb-cart", "");
    style.textContent = css;
    document.head.appendChild(style);
    // overrides to ensure above icons, white panel, narrower width
    const ov = document.createElement("style");
    ov.setAttribute("data-pb-cart-ov", "");
    ov.textContent = `
      #pb-cart-dlg{ z-index:100000 !important; }
      .pb-cart-dlg__panel{ background:#fff !important; color:#111 !important; width:min(86vw, 320px) !important; box-shadow:-10px 0 28px rgba(0,0,0,.35) !important; }
    `;
    document.head.appendChild(ov);
    return () => { style.remove(); };
  }, []);

  async function ensureCartId() {
    if (cartIdRef.current) return cartIdRef.current;
    const s = getCartState();
    if (s.id) { cartIdRef.current = s.id; return s.id; }
    const data = await gql(CART_CREATE, { lines: [] });
    const id = data?.cartCreate?.cart?.id;
    cartIdRef.current = id;
    setCartState({ ...(s||{}), id });
    return id;
  }

  async function fetchCart() {
    const id = await ensureCartId();
    const data = await gql(CART_QUERY, { id });
    const crt = data?.cart;
    setCart(crt);
    // badge
    const s = getCartState();
    s.qty = Number(crt?.totalQuantity || 0);
    s.subtotal = Number(crt?.cost?.subtotalAmount?.amount || 0);
    s.currency = crt?.cost?.subtotalAmount?.currencyCode || s.currency || "EUR";
    setCartState(s);
    // update visual badge
    const icon = document.querySelector('.pb-cart-trigger') || document.querySelector('a[href="/cart"]');
    if (icon){ let b = icon.querySelector('.pb-cart-badge'); if(!b){ b = document.createElement('span'); b.className='pb-cart-badge'; icon.appendChild(b);} const q = Number(s.qty||0); b.textContent = String(q); b.style.display = q ? 'inline-flex' : 'none'; }
    return crt;
  }

  async function cartAdd(variantId, quantity) {
    const cartId = await ensureCartId();
    await gql(CART_LINES_ADD, { cartId, lines: [{ merchandiseId: variantId, quantity: Number(quantity||1) }] });
    await fetchCart();
    setOpen(true);
    // mini-cart toast
    const s = getCartState();
    let popup = document.querySelector('.pb-minicart'); if (popup) popup.remove();
    popup = document.createElement('div'); popup.className='pb-minicart';
    popup.innerHTML = `<div class="pb-minicart__title">Añadido al carrito</div><div class="pb-minicart__row"><span>Artículos</span><strong>${s.qty||0}</strong></div><div class="pb-minicart__row"><span>Subtotal</span><strong>${formatPrice(s.subtotal||0, s.currency||'EUR')}</strong></div><div class=\"pb-minicart__actions\"><button type=\"button\" class=\"pb-btn\" data-action=\"continue\">Seguir comprando</button><button type=\"button\" class=\"pb-btn pb-btn--primary\" data-action=\"checkout\">Ir a pagar</button></div>`;
    document.body.appendChild(popup);
    const icon = document.querySelector('.pb-cart-trigger') || document.querySelector('a[href="/cart"]');
    const r = icon? icon.getBoundingClientRect() : { top:0,left:0,width:0,height:0 };
    const top = Math.max(12, window.scrollY + r.top + r.height + 10);
    const left = Math.min(window.scrollX + r.left + r.width - 320, window.scrollX + r.left);
    Object.assign(popup.style, { top: top+'px', left: left+'px' });
    requestAnimationFrame(()=>popup.classList.add('is-open'));
    let to; popup.onclick = (e)=>{ const a = e.target.closest('[data-action]'); if(!a) return; if(a.dataset.action==='checkout'){ if (cart?.checkoutUrl) window.location.href = cart.checkoutUrl; } if(a.dataset.action==='continue'){ closeMini(); } };
    function closeMini(){ if(popup){ popup.classList.remove('is-open'); setTimeout(()=>popup?.remove(),150); } }
    clearTimeout(to); to = setTimeout(closeMini, 3000);
  }

  async function cartUpdate(lineId, quantity) {
    const cartId = await ensureCartId();
    await gql(CART_LINES_UPDATE, { cartId, lines: [{ id: lineId, quantity: Number(quantity) }] });
    await fetchCart();
  }

  async function cartRemove(lineId) {
    const cartId = await ensureCartId();
    await gql(CART_LINES_REMOVE, { cartId, lineIds: [lineId] });
    await fetchCart();
  }

  function openCartPopup() { setOpen(true); fetchCart(); }
  function closeCartPopup() { setOpen(false); }

  useEffect(() => {
    // expose globals (compatibilidad legacy)
    window.openCartPopup = openCartPopup;
    window.closeCartPopup = closeCartPopup;
    window.cartAdd = cartAdd;
    window.PB_addToCart = cartAdd;
    window.PB_goToCheckout = async () => {
      const id = await ensureCartId(); if (!id) return;
      const d = await gql(CART_QUERY, { id }); const url = d?.cart?.checkoutUrl; if (url) window.location.href = url;
    };

    // Wire iconos al popup como antes
    const triggers = Array.from(document.querySelectorAll('.pb-cart-trigger, a[href="/cart"]'));
    const onClick = (e) => { e.preventDefault(); e.stopPropagation(); openCartPopup(); };
    triggers.forEach(el => { el.addEventListener('click', onClick, { passive:false }); el.setAttribute('role','button'); el.setAttribute('aria-haspopup','dialog'); el.style.cursor='pointer'; });

    // Inicialización + badge
    ensureCartId().then(fetchCart).then(updateBadgeFromState).catch(()=>{});
    return () => { triggers.forEach(el => el.removeEventListener('click', onClick)); };
  }, []);

  return (
    <div id="pb-cart-dlg" className={open ? "is-open" : ""}>
      <div className="pb-cart-dlg__overlay" data-close onClick={closeCartPopup} />
      <aside className="pb-cart-dlg__panel" role="dialog" aria-modal="true" aria-label="Carrito">
        <div className="pb-cart__head">
          <div className="pb-cart__title">Carrito <span id="pb-cart-count" style={{opacity:.6,fontWeight:700}}>({cart?.lines?.edges?.length || 0})</span></div>
          <button className="pb-cart__close" data-close onClick={closeCartPopup} aria-label="Cerrar">×</button>
        </div>
        <div id="pb-cart-list" className="pb-cart__list">
          {(cart?.lines?.edges || []).map(({ node }) => {
            const v = node?.merchandise;
            const img = v?.image?.url || "";
            const title = (v?.product?.title || "").toUpperCase();
            const color = v?.title && v.title !== "Default Title" ? v.title : "";
            const priceAmt = v?.price?.amount ?? node?.cost?.amountPerQuantity?.amount ?? 0;
            const priceCur = v?.price?.currencyCode ?? node?.cost?.amountPerQuantity?.currencyCode ?? "EUR";
            return (
              <div className="pb-cart__item" key={node.id} data-line-id={node.id}>
                <div className="pb-cart__thumb"><img src={img} alt="" /></div>
                <div>
                  <div className="pb-cart__name">{title}</div>
                  <div className="pb-cart__sub">{color || ""}</div>
                  <div className="pb-cart__qty">
                    <button className="pb-cart__btn" onClick={()=>cartUpdate(node.id, Math.max(1, node.quantity - 1))}>–</button>
                    <span className="pb-cart__q">{node.quantity}</span>
                    <button className="pb-cart__btn" onClick={()=>cartUpdate(node.id, node.quantity + 1)}>+</button>
                    <span className="pb-cart__trash" title="Eliminar" onClick={()=>cartRemove(node.id)}>🗑️</span>
                  </div>
                </div>
                <div className="pb-cart__price">{formatPrice(+priceAmt, priceCur)}</div>
              </div>
            );
          })}
          {(!cart || (cart?.lines?.edges||[]).length===0) && (
            <div style={{ padding: 24, opacity: .7 }}>Tu carrito está vacío.</div>
          )}
        </div>
        <div className="pb-cart__foot">
          <div className="pb-cart__row">
            <div style={{opacity:.8}}>Total estimado</div>
            <div id="pb-cart-total" style={{fontWeight:800}}>{formatPrice(Number(cart?.cost?.subtotalAmount?.amount||0), cart?.cost?.subtotalAmount?.currencyCode||"EUR")}</div>
          </div>
          <button className="pb-btn pb-btn--pay" id="pb-cart-pay" onClick={()=>{ if (cart?.checkoutUrl) window.location.href = cart.checkoutUrl; }}>Pagar</button>
          <button className="pb-btn pb-btn--shop" id="pb-cart-shop" onClick={closeCartPopup}>shop</button>
        </div>
      </aside>
    </div>
  );
}
