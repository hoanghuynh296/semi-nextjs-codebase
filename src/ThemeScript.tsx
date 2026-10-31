// No "use client": ThemeScript renders on the server inside <head>, before any client JS runs.
import React from "react";

export type Theme = "dark" | "light" | "system";

export interface ThemeOptions {
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
}

/**
 * Inline script that sets data-theme + .dark/.light on <html> before the first paint (no flash of the wrong theme).
 * Keep the options identical to ThemeProvider's. Exported as a string for non-React heads.
 */
export function themeScript({ defaultTheme = "dark", storageKey = "semi-theme", attribute = "data-theme" }: ThemeOptions = {}) {
  const args = JSON.stringify([defaultTheme, storageKey, attribute]);
  return `(function(d,k,a){try{var t=d;try{var s=localStorage.getItem(k);if(s==="dark"||s==="light"||s==="system")t=s}catch(e){}if(t==="system")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";var r=document.documentElement;r.setAttribute(a,t);r.classList.remove("dark","light");r.classList.add(t);r.style.colorScheme=t}catch(e){}}).apply(null,${args})`;
}

/**
 * Render inside <head> of the root layout, with the same options as ThemeProvider:
 *   <html lang="vi" suppressHydrationWarning><head><ThemeScript /></head><body><ThemeProvider>…
 */
export function ThemeScript(props: ThemeOptions) {
  return <script dangerouslySetInnerHTML={{ __html: themeScript(props) }} />;
}
