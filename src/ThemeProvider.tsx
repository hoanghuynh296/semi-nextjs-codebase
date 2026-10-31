"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Icon } from "./Icon";

export type Theme = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "semi-theme",
  attribute = "data-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    defaultTheme === "system" ? "dark" : defaultTheme
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(storageKey) as Theme | null;
      if (saved && (saved === "dark" || saved === "light" || saved === "system")) {
        setThemeState(saved);
      }
    } catch {
      // localStorage may be disabled
    }
  }, [storageKey]);

  useEffect(() => {
    const root = document.documentElement;
    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);

    // Set data-theme attribute
    root.setAttribute(attribute, resolved);

    // Toggle dark/light classes on html element for tailwind compatibility
    if (resolved === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => {
        const nextResolved = getSystemTheme();
        setResolvedTheme(nextResolved);
        root.setAttribute(attribute, nextResolved);
        if (nextResolved === "dark") {
          root.classList.add("dark");
          root.classList.remove("light");
        } else {
          root.classList.add("light");
          root.classList.remove("dark");
        }
      };
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
  }, [theme, attribute]);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem(storageKey, nextTheme);
    } catch {
      // localStorage may be disabled
    }
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme: mounted ? resolvedTheme : (defaultTheme === "system" ? "dark" : defaultTheme),
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, mounted, defaultTheme]
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
  const { resolvedTheme, toggleTheme } = useTheme();
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
      <Icon name={isDark ? "sun" : "moon"} className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
    </button>
  );
}
