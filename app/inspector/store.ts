"use client";

// The docs inspector's on / off choice (#194): on by default, remembered in localStorage, read only after mount
// (useSyncExternalStore gives the server value, on, while hydrating). Docs site only: nothing here ships in @semi/ui.
import { useSyncExternalStore } from "react";

export const INSPECTOR_KEY = "semi-docs-inspector";

const listeners = new Set<() => void>();
let cache: boolean | null = null;

function read(): boolean {
  try {
    return localStorage.getItem(INSPECTOR_KEY) !== "0";
  } catch {
    return true;
  }
}

export const inspectorOn = () => (cache ??= read());

export function setInspectorOn(on: boolean) {
  cache = on;
  try {
    localStorage.setItem(INSPECTOR_KEY, on ? "1" : "0");
  } catch {
    // private mode: the choice lasts for this page only
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // another tab changed it
  const onStorage = (e: StorageEvent) => {
    if (e.key !== INSPECTOR_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const useInspectorOn = () => useSyncExternalStore(subscribe, inspectorOn, () => true);
