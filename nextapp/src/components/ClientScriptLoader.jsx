"use client";

import { useEffect } from "react";

export default function ClientScriptLoader({ srcs = ["/js/pb-catalogo.js"], setFlags = true }) {
  useEffect(() => {
    if (setFlags && typeof window !== "undefined") {
      try {
        window.PB_BG_OWNER = window.PB_BG_OWNER || "react";
        window.PB_MUSIC_OWNER = window.PB_MUSIC_OWNER || "react";
        window.PB_COLLAGE_OWNER = window.PB_COLLAGE_OWNER || "react";
        window.PB_MODAL_OWNER = window.PB_MODAL_OWNER || "react";
      } catch (_) {}
    }

    const scripts = srcs.map((src) => {
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
  }, [srcs, setFlags]);

  return null;
}
