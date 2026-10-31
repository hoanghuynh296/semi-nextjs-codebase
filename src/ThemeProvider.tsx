"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Icon } from "./Icon";
import type { Theme, ThemeOptions } from "./ThemeScript";

export type ResolvedTheme = "dark" | "light";

export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  /** False during SSR and the first client render: theme / resolvedTheme still show defaultTheme, so hide theme-dependent UI state until it turns true. */
  mounted: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps extends ThemeOptions {
  children: React.ReactNode;
}

const isTheme = (v: unknown): v is Theme => v === "dark" || v === "light" || v === "system";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function readStoredTheme(storageKey: string): Theme | null {
  try {
    const saved = localStorage.getItem(storageKey);
    return isTheme(saved) ? saved : null;
  } catch {
    return null; // localStorage may be disabled
  }
}

function applyTheme(resolved: ResolvedTheme, attribute: string) {
  const root = document.documentElement;
  root.setAttribute(attribute, resolved);
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.style.colorScheme = resolved;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "semi-theme",
  attribute = "data-theme",
}: ThemeProviderProps) {
  // The server cannot know the stored theme, so the first render uses defaultTheme (matches the server HTML);
  // ThemeScript has already painted the right theme, and the effect below syncs state without touching <html>.
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setThemeState(readStoredTheme(storageKey) ?? defaultTheme);
    setSystemTheme(getSystemTheme());
    setReady(true);
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => setSystemTheme(getSystemTheme());
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [storageKey, defaultTheme]);

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    // Skip until the stored theme is read, so mount never overwrites what ThemeScript applied.
    if (ready) applyTheme(resolvedTheme, attribute);
  }, [ready, resolvedTheme, attribute]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // localStorage may be disabled
      }
    },
    [storageKey],
  );

  const toggleTheme = useCallback(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"), [resolvedTheme, setTheme]);

  const value = useMemo(
    () => ({
      theme: ready ? theme : defaultTheme,
      resolvedTheme: ready ? resolvedTheme : defaultTheme === "system" ? "dark" : defaultTheme,
      mounted: ready,
      setTheme,
      toggleTheme,
    }),
    [ready, theme, resolvedTheme, defaultTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a <ThemeProvider>");
  }
  return context;
}

export interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

/** Theme toggle button: seamlessly switches between Dark and Light mode. */
export function ThemeToggle({ className = "", size = "md" }: ThemeToggleProps) {
  const { resolvedTheme, mounted, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const sizeClasses = size === "sm" ? "w-7 h-7" : "w-[34px] h-[34px]";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Chuyển sang giao diện sáng (Light Mode)" : "Chuyển sang giao diện tối (Dark Mode)"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`${sizeClasses} rounded-lg bg-field hover:bg-raised border border-line text-muted hover:text-contrast flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 ${className}`}
    >
      <Icon name={isDark ? "sun" : "moon"} className={`${size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} transition-opacity ${mounted ? "" : "opacity-0"}`} />
    </button>
  );
}

const THEME_OPTIONS = [
  { key: "light", icon: "sun" },
  { key: "dark", icon: "moon" },
  { key: "system", icon: "monitor" },
] as const;

export interface ThemeSwitcherProps {
  /** Show the text label next to each icon (default: icons only, label in the tooltip). */
  showLabels?: boolean;
  /** Stretch to the container width (sidebar footers, settings rows). */
  fullWidth?: boolean;
  /** Override the labels (i18n). */
  labels?: Record<Theme, string>;
  className?: string;
}

/** Three-way theme picker (Sáng · Tối · Hệ thống) for settings pages and sidebar footers. ThemeToggle is the one-tap dark/light flip. */
export function ThemeSwitcher({
  showLabels = false,
  fullWidth = false,
  labels = { light: "Sáng", dark: "Tối", system: "Hệ thống" },
  className = "",
}: ThemeSwitcherProps) {
  const { theme, mounted, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Giao diện"
      className={`${fullWidth ? "flex w-full" : "inline-flex"} items-center gap-0.5 bg-field p-0.5 h-[34px] rounded-lg border border-line shrink-0 ${className}`}
    >
      {THEME_OPTIONS.map(({ key, icon }) => {
        // Nothing is selected until the stored theme is known (avoids flashing defaultTheme as selected).
        const on = mounted && theme === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={labels[key]}
            title={labels[key]}
            onClick={() => setTheme(key)}
            className={`${fullWidth ? "flex-1" : ""} ${showLabels ? "px-2.5" : "w-8"} h-full rounded-lg inline-flex items-center justify-center gap-1.5 text-[12px] font-medium whitespace-nowrap transition cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 ${
              on ? "bg-raised text-contrast" : "text-muted hover:text-contrast"
            }`}
          >
            <Icon name={icon} className="w-3.5 h-3.5 shrink-0" />
            {showLabels && <span>{labels[key]}</span>}
          </button>
        );
      })}
    </div>
  );
}
