"use client";

import { useEffect } from "react";

export default function PBConfig() {
  useEffect(() => {
    // Default CONFIG matching legacy values
    if (!window.CONFIG) window.CONFIG = {};
    const C = window.CONFIG;
    C.framesPath = C.framesPath ?? "/frames/frame_";
    C.totalFrames = C.totalFrames ?? 150;
    C.fps = C.fps ?? 24;
    C.pad = C.pad ?? 3;

    C.widthFactor = C.widthFactor ?? 0.76;
    C.sideSafe = C.sideSafe ?? 10;
    C.topSafe = C.topSafe ?? 8;
    C.bottomSafe = C.bottomSafe ?? 10;

    C.minCellDesktop = C.minCellDesktop ?? 200;
    C.minCellMobile = C.minCellMobile ?? 160;
    C.rowPitchScale = C.rowPitchScale ?? 0.84;
    C.jitterXPct = C.jitterXPct ?? 0.10;
    C.jitterYPct = C.jitterYPct ?? 0.10;
    C.overlapChance = C.overlapChance ?? 0.28;
    C.overlapPushXPct = C.overlapPushXPct ?? 0.18;
    C.overlapPushYPct = C.overlapPushYPct ?? 0.16;

    C.rotMaxDesktop = C.rotMaxDesktop ?? 6;
    C.rotMaxMobile = C.rotMaxMobile ?? 4;
    C.scaleMin = C.scaleMin ?? 0.94;
    C.scaleMax = C.scaleMax ?? 1.02;

    C.zSpread = C.zSpread ?? 1200;
    C.scrollAllowancePct = C.scrollAllowancePct ?? 0.22;
    C.distributeFromCenter = C.distributeFromCenter ?? true;
    // Keep seed null to randomize on each load
    C.seed = C.seed ?? null;
  }, []);
  return null;
}

