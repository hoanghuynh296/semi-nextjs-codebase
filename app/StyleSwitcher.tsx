"use client";

import React from "react";
import styleList from "../tokens/styles.json";
import { STYLE_STORAGE_KEY } from "./styleScript";

// Storybook only: previews every Semi style (tokens/styles/*.json). An app picks one style once, with
// <html data-style="…"> in its root layout; it is not a per-user setting like the theme.
export function StyleSwitcher() {
  const [style, setStyle] = React.useState<string | null>(null);
  React.useEffect(() => setStyle(document.documentElement.dataset.style ?? styleList.default), []);
  const pick = (id: string) => {
    document.documentElement.dataset.style = id;
    try {
      localStorage.setItem(STYLE_STORAGE_KEY, id);
    } catch {}
    setStyle(id);
  };
  return (
    <div role="radiogroup" aria-label="Style" className="flex w-full items-center gap-0.5 bg-field p-0.5 h-[34px] rounded-control border border-line">
      {styleList.styles.map((s) => {
        const on = style === s.id;
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={on}
            title={s.description}
            onClick={() => pick(s.id)}
            className={`flex-1 h-full rounded-control text-label font-medium transition cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 ${
              on ? "bg-raised text-contrast" : "text-muted hover:text-contrast"
            }`}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
