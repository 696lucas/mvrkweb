'use client';

import { useEffect } from 'react';

export default function TopIcons() {
  useEffect(() => {
    const triggers = Array.from(document.querySelectorAll('.pb-cart-trigger, a[href="/cart"]'));
    function onClick(e){
      if (typeof window.openCartPopup === 'function') {
        e.preventDefault();
        e.stopPropagation();
        window.openCartPopup();
      }
    }
    triggers.forEach(el => { el.addEventListener('click', onClick, { passive: false }); el.setAttribute('role','button'); el.setAttribute('aria-haspopup','dialog'); el.style.cursor='pointer'; });
    return () => { triggers.forEach(el => el.removeEventListener('click', onClick)); };
  }, []);
  return (
    <div className="pb-top-icons" aria-label="Acciones rápidas">
      <a href="/account" className="pb-top-icon" title="Cuenta">
        <img src="/icon/user.png" alt="Cuenta" />
      </a>
      <a href="/search" className="pb-top-icon" title="Buscar">
        <img src="/icon/lupa.png" alt="Buscar" />
      </a>
      <a href="/cart" className="pb-top-icon pb-cart-trigger" title="Carrito">
        <img src="/icon/carrito.png" alt="Carrito" />
      </a>
    </div>
  );
}
