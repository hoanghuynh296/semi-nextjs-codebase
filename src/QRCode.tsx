"use client";

// A scannable QR code for a payment (VietQR, EMVCo), a receipt or a link. Rendered as one SVG from the `uqr` encoder
// (no network, byte/alphanumeric/numeric chosen by the encoder). A value too long for the chosen error correction
// does not throw: the box shows a short message and `onError` fires.
//
// Documented exception to the theme rules (§9): a QR code is a machine-read symbol, so its modules are always black
// on white with a quiet zone of 4 modules, in both themes and in print. The SVG paints its own white background; only
// the frame around it uses tokens. Do not "theme" the modules: scanners need dark-on-light.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { encode } from "uqr";
import { Button } from "./Button";
import { useSemiLocale } from "./locale";
import { cn } from "../styles/utils";

export type QRCodeErrorCorrection = "L" | "M" | "Q" | "H";

const QUIET_ZONE = 4;
const MIN_SIZE = 120;

function buildPath(rows: boolean[][]): string {
  // One horizontal run per row ("M x y h w v1 h-w z"): far smaller than a rect per module.
  const parts: string[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < row.length && row[x + w]) w++;
      parts.push(`M${x + QUIET_ZONE} ${y + QUIET_ZONE}h${w}v1h-${w}z`);
      x += w;
    }
  });
  return parts.join("");
}

export function QRCode({
  value,
  size = 200,
  errorCorrection = "M",
  label,
  caption,
  copyValue,
  onError,
  print,
  className,
}: {
  /** The text to encode (a VietQR / EMVCo payload, a URL). UTF-8. */
  value: string;
  /** Edge in px including the quiet zone. Default 200, minimum 120 (smaller is clamped). */
  size?: number;
  /** Error correction: L 7%, M 15% (default), Q 25%, H 30% of the code can be damaged. Higher levels hold less. */
  errorCorrection?: QRCodeErrorCorrection;
  /** Accessible name of the image ("Mã VietQR thanh toán đơn #1042"). Required: a QR code has no text of its own. */
  label: string;
  /** Text under the code (amount, order number, the encoded string). Tabular numbers. */
  caption?: React.ReactNode;
  /** Adds a copy button. `true` copies `value`; a string copies that text instead (an account number, a link). */
  copyValue?: boolean | string;
  /** Called with the error when `value` cannot be encoded (too long for the error correction level). Nothing is thrown. */
  onError?: (error: Error) => void;
  /** For receipts and print: no frame, no copy button, pure black on white (caption included), crisp edges. */
  print?: boolean;
  className?: string;
}) {
  const t = useSemiLocale();
  const edge = Math.max(MIN_SIZE, size);
  const [copied, setCopied] = useState(false);
  const result = useMemo(() => {
    try {
      const qr = encode(value, { ecc: errorCorrection, border: 0, boostEcc: false });
      return { path: buildPath(qr.data), modules: qr.size + QUIET_ZONE * 2 };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
  }, [value, errorCorrection]);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const error = "error" in result ? result.error : undefined;
  useEffect(() => {
    if (error) onErrorRef.current?.(error);
  }, [error]);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  // Says "copied" only when the browser accepted it: there is no clipboard API on plain http (POS / LAN) or when denied.
  const copy = () => {
    navigator.clipboard?.writeText(typeof copyValue === "string" ? copyValue : value).then(
      () => {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1500);
      },
      () => undefined,
    );
  };

  return (
    <div className={cn("inline-flex max-w-full flex-col items-center gap-2", print && "bg-white text-black", className)}>
      {"path" in result ? (
        <svg
          role="img"
          aria-label={label}
          viewBox={`0 0 ${result.modules} ${result.modules}`}
          width={edge}
          height={edge}
          shapeRendering="crispEdges"
          data-qr-code=""
          data-ecc={errorCorrection}
          className={cn("block max-w-full h-auto", !print && "rounded-card border border-line")}
        >
          <rect width={result.modules} height={result.modules} fill="white" />
          <path d={result.path} fill="black" />
        </svg>
      ) : (
        <div role="alert" style={{ width: edge, height: edge }} className="flex max-w-full items-center justify-center rounded-card border border-dashed border-line p-4 text-center text-ui text-muted">
          <span>
            <span className="block font-medium text-body">{label}</span>
            {t.qrFailed}
          </span>
        </div>
      )}
      {(caption != null || (copyValue && !print && !error)) && (
        <div className={cn("flex items-center gap-1 text-ui tabular-nums", !print && "text-body")}>
          {caption != null && <span>{caption}</span>}
          {copyValue && !print && !error && (
            <Button size="sm" variant="ghost" iconOnly icon={copied ? "check" : "copy"} aria-label={copied ? t.copied : t.copy} title={copied ? t.copied : t.copy} onClick={copy} />
          )}
        </div>
      )}
    </div>
  );
}
