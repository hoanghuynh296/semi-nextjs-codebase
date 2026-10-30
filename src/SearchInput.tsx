"use client";

// Collapsible search box: shows a search icon button by default;
// expands into the text field on click or when active (value is not empty).
import React, { useEffect, useRef, useState } from "react";
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
      if (value) {
        onChange("");
      } else {
        setIsOpen(false);
      }
    }
  };

  if (!isOpen && !value) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        aria-label={label || placeholder}
        title={label || placeholder}
        className="w-[34px] h-[34px] rounded-lg bg-panel border border-line hover:border-line-hover text-gray-400 hover:text-white flex items-center justify-center transition active:scale-95 shrink-0"
      >
        <Icon name="search" className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center shrink-0 animate-in fade-in zoom-in-95 duration-150 ${className}`}
    >
      <Icon name="search" className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={label || placeholder}
        className="w-full bg-panel border border-line hover:border-line-hover rounded-lg pl-8 pr-7 h-[34px] text-[12px] text-white placeholder-gray-500 outline-none focus:border-line-hover transition"
      />
      <button
        type="button"
        onClick={handleClearOrClose}
        aria-label={value ? "Xoá tìm kiếm" : "Đóng tìm kiếm"}
        title={value ? "Xoá tìm kiếm" : "Đóng tìm kiếm"}
        className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white absolute right-1.5 top-1/2 -translate-y-1/2 transition"
      >
        <Icon name="close" className="w-3 h-3" />
      </button>
    </div>
  );
}
