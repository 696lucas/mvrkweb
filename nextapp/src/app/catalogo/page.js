"use client";

import { useEffect } from "react";
import "./catalogo.css";

export default function CatalogoPage() {
  useEffect(() => {
    // scripts que antes iban al final del <body>
    const scriptSrcs = ["/js/pb-catalogo.js"];

    const scripts = scriptSrcs.map((src) => {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      document.body.appendChild(script);
      return script;
    });

    return () => {
      scripts.forEach((script) => {
        if (script.parentNode) script.parentNode.removeChild(script);
      });
    };
  }, []);

  return (
    <div>
      {/* FONDO */}
      <canvas id="bg" aria-hidden="true"></canvas>

      {/* TÍTULO / LOGO */}
      <header className="hero" id="hero">
        <img
          src="/lettering/lettering-Bp-zbET-.webp"
          alt="Pórtate Bien"
        />
      </header>

      {/* COLLAGE */}
      <main role="main">
        <h1 className="sr-only">Catálogo — Pórtate Bien</h1>
        <section
          id="collage"
          className="collage"
          aria-label="Prendas en collage"
        ></section>
      </main>

      {/* Drawer lateral música */}
      <aside className="music-drawer" id="musicDrawer">
        <button
          className="music-drawer__trigger"
          id="musicTrigger"
          aria-controls="musicPanel"
          aria-expanded="false"
          aria-label="Abrir reproductor"
        >
          <img
            className="music-drawer__icon"
            src="/ipod/IPod_29_2009.webp"
            alt="Reproductor"
          />
        </button>

        <div
          className="music-drawer__panel"
          id="musicPanel"
          role="region"
          aria-label="Reproductor iPod"
        >
          {/* iPod MINI */}
          <div className="ipod-photo" aria-label="iPod mini">
            <div className="overlay">
              <div className="ipod-screen">
                <video
                  id="ipodVideo"
                  playsInline
                  preload="metadata"
                />
                <div>
                  <div className="ipod-title" id="ipodTitle"></div>
                  <div className="ipod-artist" id="ipodArtist"></div>
                </div>
              </div>
              <div className="ipod-wheel" id="ipodWheel">
                <button
                  className="ipod-hotzone prev"
                  id="btnPrev"
                  aria-label="Anterior"
                  title="Anterior"
                ></button>
                <button
                  className="ipod-hotzone next"
                  id="btnNext"
                  aria-label="Siguiente"
                  title="Siguiente"
                ></button>
                <button
                  className="ipod-hotzone play"
                  id="btnPlay"
                  aria-label="Play/Pause"
                  title="Play/Pause"
                ></button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== PRODUCT MODAL ===== */}
      <div id="pbProductModal" aria-hidden="true">
        {/* Blur + fondo oscuro. Clicar aquí = cerrar */}
        <div
          className="pb-modal-overlay"
          id="pbModalOverlay"
          aria-hidden="true"
        ></div>

        <div
          className="pb-product-modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pbProdTitle"
        >
          <button
            className="pb-prod-close-btn"
            id="pbProdCloseBtn"
            aria-label="Cerrar"
          >
            ×
          </button>

          <section className="pb-prod-main">
            {/* Galería / Carrusel */}
            <div className="pb-prod-gallery">
              <div className="pb-prod-carousel-frame">
                <button
                  className="pb-carousel-arrow pb-carousel-arrow--prev"
                  id="pbCarouselPrev"
                  aria-label="Anterior"
                >
                  <img
                    className="flechacarrusel"
                    src="/icon/flechaizquierda.png"
                    alt=""
                  />
                </button>
                <img
                  id="pbCarouselImage"
                  className="pb-prod-carousel-image"
                  alt="Producto"
                />
                <button
                  className="pb-carousel-arrow pb-carousel-arrow--next"
                  id="pbCarouselNext"
                  aria-label="Siguiente"
                >
                  <img
                    className="flechacarrusel"
                    src="/icon/flechaderecha.png"
                    alt=""
                  />
                </button>
              </div>
            </div>

            {/* Detalles / Comprar */}
            <div className="pb-prod-details">
              <div>
                <h2 className="pb-prod-title" id="pbProdTitle"></h2>
                <div className="pb-prod-price" id="pbProdPrice"></div>
              </div>

              {/* Colores */}
              <div className="pb-prod-colors-block">
                <div className="pb-prod-label">Color</div>
                <div className="pb-color-row" id="pbColorRow">
                  {/* pills dinámicas de color */}
                </div>
              </div>

              {/* Tallas */}
              <div className="pb-prod-sizes-block">
                <div className="pb-prod-label">Talla</div>
                <div className="pb-sizes-row" id="pbSizeRow">
                  {/* pills dinámicas de talla */}
                </div>
              </div>

              {/* Cantidad + ATC */}
              <div className="pb-purchase-row">
                <div className="pb-qty-box" id="pbQtyBox">
                  <button className="pb-qty-btn" data-delta="-1">
                    −
                  </button>
                  <div className="pb-qty-num" id="pbQtyNum">
                    1
                  </div>
                  <button className="pb-qty-btn" data-delta="1">
                    +
                  </button>
                </div>
                <button
                  className="pb-atc-btn"
                  id="pbATCBtn"
                  disabled
                >
                  Agotado
                </button>
              </div>

              {/* Descripción */}
              <div className="pb-prod-desc" id="pbProdDesc"></div>
            </div>
          </section>

          {/* Recomendados */}
          <aside className="pb-related-block">
            <div className="pb-related-title">
              <span>You may also like</span>
            </div>
            <div className="pb-related-row" id="pbRelatedRow">
              {/* tarjetas dinámicas */}
            </div>
          </aside>
        </div>
      </div>
      {/* ===== /PRODUCT MODAL ===== */}

      {/* ===== FOOTER ===== */}
      <footer
        className="pb-footer-split-wrap"
        role="contentinfo"
        aria-label="Footer"
      >
        <div className="pb-footer-split">
          <div className="pb-footer-split__inner">
            {/* Enlaces izquierda */}
            <nav className="pb-footer-links" aria-label="Footer links">
              <a className="pb-footer-link" href="/newsletter">
                NEWSLETTER
              </a>
              <a className="pb-footer-link" href="/shipping">
                SHIPPING POLICY
              </a>
              <a className="pb-footer-link" href="/terms">
                TERMS OF SERVICE
              </a>
            </nav>

            {/* Instagram + Copyright derecha */}
            <div className="pb-footer-ig-col">
              <a
                className="pb-footer-ig"
                href="https://www.instagram.com/mvrkx1?igsh=MXB5bmIxdmRma3FzNA=="
                target="_blank"
                rel="noopener"
                aria-label="Instagram MVRK"
              >
                <svg
                  className="pb-footer-ig__icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect
                    x="2.5"
                    y="2.5"
                    width="19"
                    height="19"
                    rx="5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
                </svg>
              </a>
              <div className="pb-footer-copy">© 2025</div>
            </div>
          </div>
        </div>
      </footer>

      {/* Barra fija de iconos arriba-derecha */}
      <div className="pb-top-icons" aria-label="Acciones rápidas">
        <a href="/account" className="pb-top-icon" title="Cuenta">
          <img src="/icon/user.png" alt="Cuenta" />
        </a>
        <a href="/search" className="pb-top-icon" title="Buscar">
          <img src="/icon/lupa.png" alt="Buscar" />
        </a>
        <a
          href="/cart"
          className="pb-top-icon pb-cart-trigger"
          title="Carrito"
        >
          <img src="/icon/carrito.png" alt="Carrito" />
        </a>
      </div>
    </div>
  );
}
