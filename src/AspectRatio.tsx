"use client";

// Keeps media (images, video, maps, 3D previews) at a fixed ratio while the width follows the layout.
import React from "react";
import { cn } from "../styles/utils";

export function AspectRatio({
  ratio = 16 / 9,
  className,
  children,
}: {
  /** Width / height: 16 / 9 (default), 4 / 3, 1, 3 / 4. */
  ratio?: number;
  /** Radius / border / background of the frame. */
  className?: string;
  /** Usually an <img> or <video> with "w-full h-full object-cover". */
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative w-full overflow-hidden", className)} style={{ aspectRatio: String(ratio) }}>
      {children}
    </div>
  );
}
