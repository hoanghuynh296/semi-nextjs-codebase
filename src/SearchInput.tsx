"use client";

// Collapsible search box: shows a search icon button by default;
// expands into the text field on click or when active (value is not empty).
import React, { useEffect, useRef, useState } from "react";
import { useSemiLocale } from "./locale";
import { Icon } from "./Icon";

export function SearchInput({
  value,
  onChange,
  placeholder,
  className = "w-40 sm:w-48",
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  label?: string;
}) {
  const t = useSemiLocale();
  const [isOpen, setIsOpen] = useState(() => Boolean(value));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep open whenever there is an active search query
  useEffect(() => {
    if (value) setIsOpen(true);
  }, [value]);

  // Click outside: if empty, collapse back to icon button
  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!value.trim()) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen, value]);

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  const handleClearOrClose = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault(); // clears / collapses the search, not a Modal around it
      if (value) {
        onChange("");
      } else {
        setIsOpen(false);
      }
    }
  };

  if (!isOpen && !value) {
    return (
      <button data-semi="SearchInput"
        type="button"
        onClick={handleOpen}
        aria-label={label || placeholder}
        title={label || placeholder}
        className="w-control h-control pointer-coarse:max-sm:min-h-11 pointer-coarse:max-sm:min-w-11 rounded-control bg-field border border-field-line hover:bg-item-hover text-muted hover:text-strong flex items-center justify-center transition-hover outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-95 shrink-0"
      >
        <Icon name="search" className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div data-semi="SearchInput"
      ref={containerRef}
      className={`relative flex items-center shrink-0 animate-tooltip-in ${className}`}
    >
      <Icon name="search" className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={label || placeholder}
        className="w-full bg-field border border-field-line rounded-control pl-8 pr-7 h-control pointer-coarse:max-sm:min-h-11 text-ui max-sm:text-input text-strong placeholder:text-muted outline-none focus:border-field-line-focus focus:bg-field-focus focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus transition-hover [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="button"
        onClick={handleClearOrClose}
        aria-label={value ? t.clearSearch : t.closeSearch}
        title={value ? t.clearSearch : t.closeSearch}
        className="w-5 h-5 rounded-chip flex items-center justify-center text-muted hover:text-strong absolute right-1.5 top-1/2 -translate-y-1/2 transition-hover outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <Icon name="close" className="w-3 h-3" />
      </button>
    </div>
  );
}
