"use client";

import "./catalogo.css";
import ModelsLoader from "@/components/ModelsLoader";
import PBConfig from "@/components/PBConfig";
import BackgroundCanvas from "@/components/BackgroundCanvas";
import Hero from "@/components/Hero";
import Collage from "@/components/Collage";
import MusicDrawer from "@/components/MusicDrawer";
import ProductModal from "@/components/ProductModal";
import Footer from "@/components/Footer";
import TopIcons from "@/components/TopIcons";
import CartDrawer from "@/components/CartDrawer";

export default function CatalogoPage() {
  return (
    <div>
      <PBConfig />
      <ModelsLoader />
      <BackgroundCanvas />
      <Hero />
      <Collage />
      <MusicDrawer />
      <ProductModal />
      <CartDrawer />
      <Footer />
      <TopIcons />
    </div>
  );
}
