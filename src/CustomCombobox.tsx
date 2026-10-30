import React, { useState, useRef, useEffect } from "react";
import { Icon } from "./Icon";

interface Option {
  value: string;
  label?: string;
}

interface CustomComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: (string | Option)[];
  placeholder?: string;
  required?: boolean;
}

export function CustomCombobox({
  value,
  onChange,
  options,
  placeholder = "Chọn hoặc nhập mới...",
  required = false,
}: CustomComboboxProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: Option[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.value.toLowerCase().includes((value || "").toLowerCase()) ||
    (opt.label && opt.label.toLowerCase().includes((value || "").toLowerCase()))
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-field border border-line rounded-lg pl-3 pr-8 py-2 text-[13px] text-white placeholder-gray-500 focus:border-primary-500/60 transition outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen((prev) => !prev)}
          className="absolute right-2.5 p-1 text-gray-400 hover:text-white transition cursor-pointer"
        >
          <Icon name="chevronDown" className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-panel/95 backdrop-blur-xl border border-line rounded-lg shadow-2xl z-50 p-1 flex flex-col gap-0.5 custom-scrollbar">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-gray-400 italic">
              Không có sẵn &mdash; bấm lưu để thêm &quot;{value}&quot;
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.value.toLowerCase() === (value || "").toLowerCase();
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-[12px] transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-primary-500/15 text-primary-400 font-medium"
                      : "text-gray-200 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <span className="truncate">{opt.label || opt.value}</span>
                  {isSelected && (
                    <Icon name="check" className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

