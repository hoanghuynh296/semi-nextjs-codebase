import { PageSkeleton } from "@semi/ui";

// The four page shapes of a route loading.tsx (`inShell`: no full-page height or padding).
export default function SkeletonShapes() {
  return (
    <div className="flex flex-col gap-6">
      {(["cards", "list", "detail", "workspace"] as const).map((shape) => (
        <div key={shape} data-shape={shape} className="max-h-56 overflow-hidden">
          <PageSkeleton shape={shape} inShell />
        </div>
      ))}
    </div>
  );
}
