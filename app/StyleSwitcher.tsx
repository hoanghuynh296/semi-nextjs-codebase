"use client";

import React from "react";
import styleList from "../tokens/styles.json";
import { PALETTE_STORAGE_KEY, STYLE_STORAGE_KEY } from "./styleScript";

// Storybook only: previews every Semi style (tokens/styles/*.json) and its palettes. An app picks one style and palette
// once, with <html data-style="…" data-palette="…"> in its root layout; it is not a per-user setting like the theme.
const store = (key: string, value: string | null) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {}
};

function Segmented({ label, options, value, onPick }: { label: string; options: { id: string; name: string; description: string }[]; value: string | null; onPick: (id: string) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex w-full items-center gap-0.5 bg-field p-0.5 h-control rounded-control border border-line">
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            title={o.description}
            onClick={() => onPick(o.id)}
            className={`flex-1 min-w-0 truncate h-full rounded-control text-label font-medium transition cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 ${
              on ? "bg-raised text-contrast" : "text-muted hover:text-contrast"
            }`}
          >
            {o.name}
          </button>
        );
      })}
    </div>
  );
}

export function StyleSwitcher() {
  const [style, setStyle] = React.useState<string | null>(null);
  const [palette, setPalette] = React.useState<string | null>(null);
  React.useEffect(() => {
    const d = document.documentElement;
    const s = styleList.styles.find((x) => x.id === d.dataset.style) ?? styleList.styles[0];
    setStyle(s.id);
    setPalette(s.palettes.some((p) => p.id === d.dataset.palette) ? d.dataset.palette! : s.palettes[0].id);
  }, []);
  const current = styleList.styles.find((s) => s.id === style);
  const pickStyle = (id: string) => {
    const d = document.documentElement;
    d.dataset.style = id;
    delete d.dataset.palette; // each style starts on its own default palette
    store(STYLE_STORAGE_KEY, id);
    store(PALETTE_STORAGE_KEY, null);
    setStyle(id);
    setPalette(styleList.styles.find((s) => s.id === id)!.palettes[0].id);
  };
  const pickPalette = (id: string) => {
    const d = document.documentElement;
    const isDefault = current?.palettes[0].id === id;
    if (isDefault) delete d.dataset.palette;
    else d.dataset.palette = id;
    store(PALETTE_STORAGE_KEY, isDefault ? null : id);
    setPalette(id);
  };
  return (
    <div className="flex flex-col gap-2">
      <Segmented label="Style" options={styleList.styles} value={style} onPick={pickStyle} />
      {current && <Segmented label="Palette" options={current.palettes} value={palette} onPick={pickPalette} />}
    </div>
  );
}
