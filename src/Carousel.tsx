"use client";

// Slides in a row that scroll by swipe, trackpad, arrows or the dots (scroll-snap, no library). For product photos,
// onboarding steps, featured items; never for content people must not miss.
import React, { Children, useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { useSemiLocale } from "./locale";
import { FOCUS_RING, cn } from "../styles/utils";

export function Carousel({
  label,
  perView = 1,
  className,
  children,
}: {
  /** Accessible name of the carousel ("Ảnh sản phẩm"). */
  label: string;
  /** Slides visible at once from sm up (phones always show one and a peek of the next). */
  perView?: 1 | 2 | 3 | 4;
  className?: string;
  /** One child per slide. */
  children: React.ReactNode;
}) {
  const t = useSemiLocale();
  const slides = Children.toArray(children);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const pages = Math.max(1, slides.length - perView + 1);
  const width = { 1: "sm:basis-full", 2: "sm:basis-[calc((100%-0.75rem)/2)]", 3: "sm:basis-[calc((100%-1.5rem)/3)]", 4: "sm:basis-[calc((100%-2.25rem)/4)]" }[perView];

  const go = useCallback((i: number) => {
    const track = trackRef.current;
    const slide = track?.children[Math.max(0, Math.min(i, slides.length - 1))] as HTMLElement | undefined;
    if (track && slide) track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }, [slides.length]);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const first = track.children[0] as HTMLElement | undefined;
      const step = first ? first.offsetWidth + 12 : track.clientWidth;
      setIndex(Math.round(track.scrollLeft / step));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  const nav = cn("w-8 h-8 rounded-full bg-panel border border-line shadow-float flex items-center justify-center text-body hover:text-contrast disabled:opacity-0 transition", FOCUS_RING);
  return (
    <section aria-roledescription="carousel" aria-label={label} className={cn("relative", className)}>
      <div
        ref={trackRef}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            go(index + (e.key === "ArrowRight" ? 1 : -1));
          }
        }}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory overscroll-x-contain scroll-smooth rounded-card outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
      >
        {slides.map((slide, i) => (
          <div key={i} role="group" aria-roledescription="slide" aria-label={t.slide(i + 1, slides.length)} className={cn("snap-start shrink-0 basis-[85%]", width)}>
            {slide}
          </div>
        ))}
      </div>
      {slides.length > perView && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-2 right-2 hidden sm:flex items-center justify-between">
            <button type="button" aria-label={t.prevSlide} disabled={index <= 0} onClick={() => go(index - 1)} className={cn(nav, "pointer-events-auto")}>
              <Icon name="back" className="w-4 h-4" />
            </button>
            <button type="button" aria-label={t.nextSlide} disabled={index >= pages - 1} onClick={() => go(index + 1)} className={cn(nav, "pointer-events-auto")}>
              <Icon name="chevron" className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex justify-center gap-1.5">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={t.goToSlide(i + 1)}
                aria-current={i === index || undefined}
                onClick={() => go(i)}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-accent" : "w-1.5 bg-line-hover hover:bg-muted", FOCUS_RING)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
