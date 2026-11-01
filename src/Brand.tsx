// The brand's signature pieces (docs/DESIGN_SYSTEM.md §19, docs/BRANDS.md "Chữ ký thương hiệu"): the motif and the
// big number. Both read the brand kit's CSS variables (--brand-motif, font-figure, font-title), so the same code
// looks like each brand; without a brand kit they fall back to Semi's dots and the style's figure font.
import React from "react";

const DOTS = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Ccircle cx='8' cy='8' r='1.5'/%3E%3C/svg%3E")`;
const MOTIF_TONE = { accent: "text-accent-fg opacity-15", muted: "text-muted opacity-20", "on-accent": "text-on-accent opacity-20" } as const;

/**
 * The brand's repeating motif (from its logo mark, dots, lines or a grid; brand.json "motif") as a decorative layer.
 * Put it first inside a `relative overflow-hidden` block: a hero, an empty state, a cover or avatar placeholder. Text
 * never sits on the motif itself: keep it on the calm half (`area="end"`) or on a panel above it. Never behind tables or
 * forms. Renders nothing visible when the brand chose no motif.
 */
export function BrandPattern({
  tone = "accent",
  area = "end",
  className = "",
}: {
  /** Colour of the motif: accent (on a neutral surface), muted, or on-accent (on a bg-accent hero). */
  tone?: keyof typeof MOTIF_TONE;
  /** end = the end half only (text at the start stays on a calm background); full = the whole block. */
  area?: "end" | "full";
  className?: string;
}) {
  const mask = `var(--brand-motif, ${DOTS})`;
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 end-0 ${area === "end" ? "start-1/2" : "start-0"} bg-current ${MOTIF_TONE[tone]} ${className}`}
      style={{ maskImage: mask, WebkitMaskImage: mask, maskSize: "var(--brand-motif-size, 16px)", WebkitMaskSize: "var(--brand-motif-size, 16px)" }}
    />
  );
}

/**
 * A big number set in the brand's figure font and title weight: the one figure a landing section, a report cover or
 * a dashboard leads with. For a metric among others in a card row use KpiCard (featured for the main one).
 */
export function BrandFigure({
  value,
  label,
  sub,
  size = "lg",
  onAccent = false,
  className = "",
}: {
  value: React.ReactNode;
  /** What the number counts, in a few words. */
  label: React.ReactNode;
  /** Optional context: period, comparison, source. */
  sub?: React.ReactNode;
  /** lg = display size; xl = hero size (1.6 × display). */
  size?: "lg" | "xl";
  /** On a bg-accent block (expressive hero): text-on-accent instead of the neutral text colours. */
  onAccent?: boolean;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div
        className={`font-figure font-title text-display leading-none tracking-tight tabular-nums ${onAccent ? "text-on-accent" : "text-contrast"}`}
        style={size === "xl" ? { fontSize: "calc(var(--text-display) * 1.6)" } : undefined}
      >
        {value}
      </div>
      <div className={`mt-2 text-ui-lg font-medium ${onAccent ? "text-on-accent" : "text-body"}`}>{label}</div>
      {sub !== undefined && sub !== null && <div className={`mt-0.5 text-label ${onAccent ? "text-on-accent" : "text-muted"}`}>{sub}</div>}
    </div>
  );
}
