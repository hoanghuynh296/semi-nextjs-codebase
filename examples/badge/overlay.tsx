import { Badge } from "@semi/ui";

// A stand-in photo (inline SVG) so the example needs no image file.
const PHOTO =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#2f4858"/><circle cx="250" cy="48" r="22" fill="#86a8b8"/><polygon points="0,140 70,80 130,125 200,60 320,150 320,180 0,180" fill="#1d3340"/><polygon points="0,160 90,120 170,158 260,118 320,140 320,180 0,180" fill="#14252f"/></svg>',
  );

export default function BadgeOverlay() {
  return (
    <div className="relative w-full max-w-sm aspect-video rounded-card overflow-hidden">
      <img src={PHOTO} alt="Ảnh xem trước bản in" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        <Badge tone="overlay" icon="video">
          Video
        </Badge>
      </div>
      <Badge tone="overlay" className="absolute bottom-2 right-2 tabular-nums">
        2:14
      </Badge>
    </div>
  );
}
