"use client";

import React from "react";
import tokens from "../tokens/tokens.json";
import styleList from "../tokens/styles.json";
import { brandCss, generateBrand } from "../brand/generate.mjs";
import { Icon } from "../src/Icon";

// Storybook only: previews a brand (docs/BRANDS.md) on every page. The brand comes from the link semi-brand preview
// prints (#brand=<base64url brand.json>) or from the Brand preview page, and stays in localStorage until turned off.
export const BRAND_STORAGE_KEY = "semi-brand-preview";
const BRAND_EVENT = "semi-brand-preview";
/** Font variables the Storybook layout already loads with next/font. */
const LOADED_FONTS = ["--font-geist", "--font-montserrat-alternates", "--font-jakarta", "--font-space-grotesk"];

export type Brand = {
  name: string;
  package: string;
  primary: string;
  secondary?: string | null;
  neutral: "tinted" | "preset";
  palettes?: Record<string, string>;
  styles: { default: string; allowed: string[] };
  fonts: { sans: string; display: string };
  semi?: string;
};

export type BrandResult = {
  tokens: {
    primary: Record<string, string>;
    secondary?: Record<string, string>;
    brandStep: number;
    themes: Record<string, Record<string, string>>;
    /** Per theme: the shade of the button and of coloured text, and how far (OKLab ΔE) the button is from the brand colour. */
    fidelity: Record<string, { fill: number; text: number; deltaE: number }>;
    fonts: { family: string; variable: string }[];
  };
  css: string;
  /** min: 4.5 for text, 3 for focus rings and fills; soft: reported, never blocks the kit. */
  report: { check: string; pair: string; ratio: number; min: number; ok: boolean; soft?: boolean }[];
  warnings: string[];
};

/** generateBrand with the Storybook's own tokens; errors come back as { error }. */
export function buildBrand(brand: Brand): BrandResult | { error: string } {
  try {
    return generateBrand(brand, { tokens, styles: styleList }) as unknown as BrandResult;
  } catch (e) {
    return { error: (e as Error).message };
  }
}

const read = (): Brand | null => {
  try {
    const hash = window.location.hash.match(/#brand=([\w-]+)/);
    if (hash) {
      const b64 = hash[1].replace(/-/g, "+").replace(/_/g, "/");
      const brand = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))) as Brand;
      localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brand));
      history.replaceState(null, "", window.location.pathname + window.location.search);
      return brand;
    }
    const raw = localStorage.getItem(BRAND_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Brand) : null;
  } catch {
    return null;
  }
};

/** Apply (or with null, remove) a brand on this page and remember it for the other pages. */
export function setPreviewBrand(brand: Brand | null) {
  try {
    if (brand) localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brand));
    else localStorage.removeItem(BRAND_STORAGE_KEY);
  } catch {}
  window.dispatchEvent(new Event(BRAND_EVENT));
}

export const getPreviewBrand = read;

function apply(brand: Brand | null): string | null {
  document.getElementById("semi-brand-preview")?.remove();
  document.getElementById("semi-brand-fonts")?.remove();
  if (!brand) return null;
  const r = buildBrand(brand);
  if ("error" in r) return null;
  const style = document.createElement("style");
  style.id = "semi-brand-preview";
  // The page is already built: plain :root variables instead of @theme, plus the fonts next/font has not loaded.
  style.textContent = brandCss(r.tokens, "", { runtime: true, loadedFonts: LOADED_FONTS });
  document.head.appendChild(style);
  const extra = r.tokens.fonts.filter((f) => !LOADED_FONTS.includes(f.variable));
  if (extra.length) {
    const link = document.createElement("link");
    link.id = "semi-brand-fonts";
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${extra.map((f) => `family=${encodeURIComponent(f.family)}:wght@400;500;600;700`).join("&")}&display=swap`;
    document.head.appendChild(link);
  }
  return brand.name;
}

/** Mounted once in the Storybook shell: applies the stored brand on every page and shows which one is on. */
export function BrandPreviewHost() {
  const [name, setName] = React.useState<string | null>(null);
  React.useEffect(() => {
    const sync = () => setName(apply(read()));
    sync();
    window.addEventListener(BRAND_EVENT, sync);
    return () => window.removeEventListener(BRAND_EVENT, sync);
  }, []);
  if (!name) return null;
  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-toast flex items-center gap-2 pl-3 pr-1 h-control rounded-full bg-panel border border-line shadow-overlay text-label text-body">
      <Icon name="palette" className="w-3.5 h-3.5 text-accent-fg" />
      <span>
        Brand <strong className="font-semibold text-contrast">{name}</strong>
      </span>
      <a href="./brand" className="text-accent-fg hover:text-contrast font-medium">
        Sửa
      </a>
      <button
        type="button"
        onClick={() => setPreviewBrand(null)}
        aria-label="Tắt xem trước brand"
        title="Tắt xem trước brand"
        className="w-7 h-7 rounded-full inline-flex items-center justify-center text-muted hover:text-contrast hover:bg-raised"
      >
        <Icon name="close" className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
