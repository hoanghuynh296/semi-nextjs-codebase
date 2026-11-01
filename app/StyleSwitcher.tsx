"use client";

import React from "react";
import styleList from "../tokens/styles.json";
import { STYLE_STORAGE_KEY } from "./styleScript";

// Storybook only: previews every Semi style (Flat, Soft, Sharp). An app picks its style once, with
// <html data-style="…"> in its root layout; it is not a per-user setting like the theme.
const store = (key: string, value: string | null) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {}
};

export function StyleSwitcher() {
  const [style, setStyle] = React.useState<string | null>(null);
  React.useEffect(() => {
    const d = document.documentElement;
    setStyle(styleList.styles.find((x) => x.id === d.dataset.style)?.id ?? styleList.styles[0].id);
  }, []);
  const pickStyle = (id: string) => {
    const d = document.documentElement;
    d.dataset.style = id;
    store(STYLE_STORAGE_KEY, id);
    setStyle(id);
  };
  return (
    <div role="radiogroup" aria-label="Style" className="flex w-full items-center gap-0.5 bg-field p-0.5 h-control rounded-control border border-line">
      {styleList.styles.map((o) => {
        const on = style === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            title={o.description}
            onClick={() => pickStyle(o.id)}
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
