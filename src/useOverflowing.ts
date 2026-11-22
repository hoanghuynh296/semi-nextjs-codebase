"use client";

// Internal (not exported from index): lets a capped state become keyboard-scrollable only when it overflows.
import { useEffect, useRef, useState } from "react";

/** True while the element's content is taller than its box (the phone cap), so it can be made keyboard-scrollable. */
export function useOverflowing<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [over, setOver] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOver(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, over] as const;
}
