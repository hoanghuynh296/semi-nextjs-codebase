import { AspectRatio } from "@semi/ui";

export default function AspectRatioBasic() {
  return (
    <div className="grid gap-3 grid-cols-2 max-w-md">
      <AspectRatio className="rounded-card border border-line bg-field">
        <div className="flex h-full items-center justify-center text-label text-muted">16 : 9</div>
      </AspectRatio>
      <AspectRatio ratio={1} className="rounded-card border border-line bg-field">
        <div className="flex h-full items-center justify-center text-label text-muted">1 : 1</div>
      </AspectRatio>
    </div>
  );
}
