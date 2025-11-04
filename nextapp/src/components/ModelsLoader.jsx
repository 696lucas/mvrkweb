"use client";

import { useEffect } from "react";

// Minimal Shopify client copied from legacy for collection fetch
const SHOPIFY_DOMAIN = "qhzkkr-2d.myshopify.com";
const STOREFRONT_TOKEN = "b919997de07b4172affb1803d79a6509";
const API_URL = `https://${SHOPIFY_DOMAIN}/api/2025-01/graphql.json`;

const COLLECTION_HANDLE = "frontpage";

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

function base(u){ return u ? (u.split('/').pop()||'').split('?')[0] : ''; }

function formatPrice(amt, cur = 'EUR'){
  try { return new Intl.NumberFormat('es-ES',{ style:'currency', currency:cur }).format(Number(amt||0)); }
  catch { return `${amt} ${cur}`; }
}

function toModel(product){
  const prodImgs = product?.images?.edges?.map(e => e.node.url) || [];
  const variantEdges = product?.variants?.edges || [];

  // Globals like in legacy
  window.KEY_TO_SIZES = window.KEY_TO_SIZES || new Map();
  window.KEY_TO_VARIANT = window.KEY_TO_VARIANT || new Map();

  if (!variantEdges.length){
    const fImg = product?.featuredImage?.url || prodImgs[0] || '';
    const k = base(fImg);
    return {
      title: product?.title || '',
      variants: [{
        colorLabel: '',
        key: k,
        price: '',
        desc: product?.description || '',
        images: prodImgs.slice(0,3),
        soldOut: true,
      }]
    };
  }

  // 1) Group by color (if no Color option, use 'default')
  const groups = new Map();
  for (const { node } of variantEdges){
    const opts = node.selectedOptions || [];
    const colorOpt = opts.find(o => (o.name||'').toLowerCase() === 'color');
    const colorValue = (colorOpt?.value || '').trim();
    const groupKey = colorValue || 'default';

    let g = groups.get(groupKey);
    if (!g){ g = { colorLabel: colorValue, nodes: [], imageUrl: null }; groups.set(groupKey, g); }
    g.nodes.push(node);
    if (!g.imageUrl){ g.imageUrl = node.image?.url || product.featuredImage?.url || prodImgs[0] || ''; }
  }

  const variants = [];
  for (const g of groups.values()){
    const nodes = g.nodes;
    const mainNode = nodes.find(n => n.availableForSale) || nodes[0];
    const vImg = g.imageUrl || mainNode.image?.url || product.featuredImage?.url || prodImgs[0] || '';
    const cdnKey = base(vImg);

    const amountNum = Number(mainNode.price?.amount || 0);
    const currency = mainNode.price?.currencyCode || 'EUR';
    const priceStr = formatPrice(amountNum, currency);

    const images = mainNode.image?.url
      ? [mainNode.image.url, ...prodImgs.filter(u => u !== mainNode.image.url)]
      : [vImg, ...prodImgs.filter(u => u !== vImg)];

    // sizes per color
    const sizeMap = new Map();
    for (const n of nodes){
      const opts = n.selectedOptions || [];
      const sizeOpt = opts.find(o => {
        const name = (o.name||'').toLowerCase();
        return name === 'talla' || name === 'tamano' || name === 'tamaño' || name === 'size';
      });
      if (!sizeOpt) continue;
      const sizeLabel = (sizeOpt.value||'').trim();
      if (!sizeLabel) continue;
      const existing = sizeMap.get(sizeLabel);
      if (!existing || (n.availableForSale && !existing.available)){
        sizeMap.set(sizeLabel, { label: sizeLabel, available: n.availableForSale, id: n.id });
      }
    }
    const sizes = Array.from(sizeMap.values());
    window.KEY_TO_SIZES.set(cdnKey, sizes);

    const available = nodes.some(n => n.availableForSale);
    const payload = { id: mainNode.id, available, price: priceStr, amount: amountNum, currency };
    window.KEY_TO_VARIANT.set(cdnKey, payload);

    variants.push({
      colorLabel: g.colorLabel || '',
      key: cdnKey,
      price: priceStr,
      desc: product?.description || '',
      images: images.slice(0,3),
      soldOut: !available,
    });
  }

  return { title: product?.title || '', variants };
}

function mapModels(data){
  const edges = data?.collection?.products?.edges || [];
  const models = {};
  edges.forEach(({ node }) => {
    models[node.handle] = toModel(node);
  });
  return models;
}

export default function ModelsLoader() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await gql(COLLECTION_PRODUCTS, { handle: COLLECTION_HANDLE });
        if (cancelled) return;
        const models = mapModels(data);
        window.PB_MODELS = { ...(window.PB_MODELS || {}), ...models };
        window.PB_MODELS_LOADED = true;
        if (typeof window.pbRefreshCollage === "function") window.pbRefreshCollage();
      } catch (err) {
        console.error("[PB] Error cargando productos Shopify (React):", err);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return null;
}
