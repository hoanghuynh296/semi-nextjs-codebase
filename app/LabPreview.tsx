"use client";

import React from "react";
import Link from "next/link";
import tokens from "../tokens/tokens.json";
import { PARAMS } from "../brand/params.mjs";
import { decodeDraft, diffDraft, emptyDraft, isEmptyDraft, labCss } from "../scripts/lab.mjs";
import { Button } from "../src/Button";
import { Icon } from "../src/Icon";

// Docs site only: the Design Lab (docs/LAB.md). A draft of core values (type, shape, densities, generator params) is
// applied on every page until it is reset; it comes from the Lab page or a shared link (#lab=<base64url draft>).
export const LAB_STORAGE_KEY = "semi-lab-draft";
const LAB_EVENT = "semi-lab-draft";

export type LabDraft = {
  $semiLab: number;
  type: Record<string, string>;
  density: Record<string, { spacing?: string; sizes?: Record<string, string> }>;
  typeScale: Record<string, { sizes?: Record<string, string> }>;
  shape: Record<string, string>;
  params: Record<string, number | Record<string, number>>;
};
type Stored = { draft: LabDraft; paused?: boolean };

/** What the Lab reads its current values from (and lab-apply writes to). */
export const LAB_SOURCES = { tokens, params: PARAMS };

const read = (): Stored => {
  try {
    const hash = window.location.hash.match(/#lab=([\w-]+)/);
    if (hash) {
      const stored: Stored = { draft: { ...emptyDraft(), ...decodeDraft(hash[1]) } as LabDraft };
      localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(stored));
      history.replaceState(null, "", window.location.pathname + window.location.search);
      return stored;
    }
    const raw = localStorage.getItem(LAB_STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Stored;
      return { ...s, draft: { ...emptyDraft(), ...s.draft } as LabDraft };
    }
  } catch {}
  return { draft: emptyDraft() as LabDraft };
};

export const getLab = read;

/** Store the draft (and whether it is paused) and apply it on this page. */
export function setLab(next: Stored) {
  try {
    if (isEmptyDraft(next.draft)) localStorage.removeItem(LAB_STORAGE_KEY);
    else localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event(LAB_EVENT));
}

/** The generator params of the active (not paused) draft, for the brand preview. */
export function labParams(): LabDraft["params"] | undefined {
  const s = read();
  return s.paused || isEmptyDraft(s.draft) ? undefined : s.draft.params;
}

/** Re-render when the draft changes (on this page or in another tab). */
export function useLab(): Stored {
  const [state, setState] = React.useState<Stored>({ draft: emptyDraft() as LabDraft });
  React.useEffect(() => {
    const sync = () => setState(read());
    sync();
    window.addEventListener(LAB_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LAB_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return state;
}

export const onLabChange = (fn: () => void) => {
  window.addEventListener(LAB_EVENT, fn);
  return () => window.removeEventListener(LAB_EVENT, fn);
};

/** Mounted once in the docs shell: applies the draft on every page and shows that it is on. */
export function LabHost() {
  const { draft, paused } = useLab();
  React.useEffect(() => {
    document.getElementById("semi-lab")?.remove();
    const css = paused ? "" : labCss(draft, LAB_SOURCES);
    if (!css) return;
    const style = document.createElement("style");
    style.id = "semi-lab";
    style.textContent = css;
    document.head.appendChild(style);
  }, [draft, paused]);
  if (isEmptyDraft(draft)) return null;
  const count = diffDraft(draft, LAB_SOURCES).length;
  return (
    <div className="flex items-center gap-2 pl-3 pr-1 h-control rounded-full bg-panel border border-line shadow-overlay text-label text-body">
      <Icon name="sliders" className="w-3.5 h-3.5 text-accent-fg" />
      <span>
        Design Lab <strong className="font-semibold text-contrast tabular-nums">{count}</strong> thay đổi{paused && " · đang tắt"}
      </span>
      <Link href="/lab/" className="text-accent-fg hover:text-contrast font-medium">
        Sửa
      </Link>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        icon={paused ? "play" : "pause"}
        onClick={() => setLab({ draft, paused: !paused })}
        aria-label={paused ? "Bật lại bản nháp Lab" : "Tạm tắt bản nháp Lab (xem bản gốc)"}
        title={paused ? "Bật lại bản nháp Lab" : "Tạm tắt bản nháp Lab (xem bản gốc)"}
      />
    </div>
  );
}
