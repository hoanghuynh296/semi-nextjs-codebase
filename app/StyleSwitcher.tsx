"use client";

import React from "react";
import styleList from "../tokens/styles.json";
import { STYLE_STORAGE_KEY } from "./styleScript";
import { ToggleGroup } from "../src/Toggle";

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
    <ToggleGroup
      label="Style"
      className="w-full *:flex-1"
      value={style ? [style] : []}
      onChange={(v) => v[0] && pickStyle(v[0])}
      options={styleList.styles.map((o) => ({ key: o.id, label: o.name }))}
    />
  );
}
