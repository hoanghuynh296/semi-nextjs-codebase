"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSemiLocale } from "./locale";
import { Icon, type IconName } from "./Icon";
import { Menu, Tooltip, type MenuItem } from "./Overlay";
import { BTN_ICON, BTN_SECONDARY } from "../styles/buttons";
import { cn, SEGMENT_ON } from "../styles/utils";
import type { Theme, ThemeOptions } from "./ThemeScript";
import type { ShellNavItem } from "./AppShell";

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
  const t = useSemiLocale();
  const { resolvedTheme, mounted, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const sizeClasses = size === "sm" ? "w-7 h-7" : "w-control h-control";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? t.toLight : t.toDark}
      aria-label={isDark ? t.toLight : t.toDark}
      className={`${sizeClasses} rounded-control bg-field hover:bg-raised border border-line text-muted hover:text-strong flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 ${className}`}
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

/** The three choices as Menu radio items (`menuitemradio`; the menu opens on the current one), the current one `checked` (none until the stored theme is known). */
export function useThemeChoices(labelsProp?: Record<Theme, string>) {
  const t = useSemiLocale();
  const labels = labelsProp ?? { light: t.themeLight, dark: t.themeDark, system: t.themeSystem };
  const { theme, mounted, setTheme } = useTheme();
  const items: MenuItem[] = THEME_OPTIONS.map(({ key, icon }) => ({ label: labels[key], icon, radio: true, checked: mounted && theme === key, onSelect: () => setTheme(key) }));
  // the chosen mode's icon; hidden until the stored theme is read, so it never swaps after hydration
  const icon: IconName = THEME_OPTIONS.find((o) => o.key === theme)?.icon ?? "sun";
  return { items, icon, label: t.theme, mounted };
}

/**
 * The theme as an AppShell `tools` item (for an app without an account; otherwise the route header's account menu
 * holds the theme): an icon that opens a Menu of Light / Dark / System with the current one checked; a level of the
 * phone drawer. Keeps "system", unlike a `toggleTheme` item.
 *
 * ```tsx
 * const theme = useThemeUtility();
 * <AppShell tools={[theme, help]} … />
 * ```
 */
export function useThemeUtility({ id = "theme", label, labels }: { id?: string; label?: string; labels?: Record<Theme, string> } = {}): ShellNavItem {
  const choices = useThemeChoices(labels);
  return { id, label: label ?? choices.label, icon: choices.icon, iconHidden: !choices.mounted, menu: choices.items };
}

export interface ThemeSwitcherProps {
  /**
   * `segmented` (default): the three choices side by side, for settings pages and sidebar footers. `menu`: one icon
   * button (the chosen mode's icon) whose Menu lists the three with the current one checked, for headers, toolbars
   * and other tight spots; in AppShell the account avatar menu already holds the theme (`useThemeUtility()` for `tools` when there is no account).
   * @default "segmented"
   */
  variant?: "segmented" | "menu";
  /** Show the text label next to each icon (default: icons only, label in the tooltip). `segmented` only. */
  showLabels?: boolean;
  /** Stretch to the container width (sidebar footers, settings rows). `segmented` only. */
  fullWidth?: boolean;
  /** Override the labels (default: the SemiLocaleProvider strings). */
  labels?: Record<Theme, string>;
  className?: string;
}

/** Three-way theme picker (Sáng · Tối · Hệ thống): segmented for settings pages and sidebar footers, `variant="menu"` as one icon button. ThemeToggle is the one-tap dark/light flip. */
export function ThemeSwitcher({ variant = "segmented", ...props }: ThemeSwitcherProps) {
  return variant === "menu" ? <ThemeMenuButton labels={props.labels} className={props.className} /> : <ThemeSegments {...props} />;
}

function ThemeMenuButton({ labels, className = "" }: { labels?: Record<Theme, string>; className?: string }) {
  const { items, icon, label, mounted } = useThemeChoices(labels);
  return (
    <Menu
      label={label}
      items={items}
      trigger={
        <Tooltip content={label}>
          <button type="button" aria-label={label} className={cn(BTN_SECONDARY, BTN_ICON, className)}>
            <Icon name={icon} className={cn("w-4 h-4 transition-opacity", !mounted && "opacity-0")} />
          </button>
        </Tooltip>
      }
    />
  );
}

function ThemeSegments({ showLabels = false, fullWidth = false, labels: labelsProp, className = "" }: Omit<ThemeSwitcherProps, "variant">) {
  const t = useSemiLocale();
  const labels = labelsProp ?? { light: t.themeLight, dark: t.themeDark, system: t.themeSystem };
  const { theme, mounted, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label={t.theme}
      className={`${fullWidth ? "flex w-full" : "inline-flex"} items-center gap-0.5 bg-field p-0.5 h-control rounded-control border border-line shrink-0 ${className}`}
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
            className={`${fullWidth ? "flex-1" : ""} ${showLabels ? "px-2.5" : "w-8"} h-full rounded-control inline-flex items-center justify-center gap-1.5 text-chrome font-medium whitespace-nowrap transition cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-focus ${
              on ? SEGMENT_ON : "text-muted hover:text-strong"
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
