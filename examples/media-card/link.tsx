import { MediaCard } from "@semi/ui";

// Stand-in photos (inline SVG) so the example needs no image files; n turns the hue.
const photo = (n: number) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><g style="filter:hue-rotate(${n * 47}deg)"><rect width="320" height="180" fill="#2f4858"/><circle cx="250" cy="48" r="22" fill="#86a8b8"/><polygon points="0,140 70,80 130,125 200,60 320,150 320,180 0,180" fill="#1d3340"/></g></svg>`,
  );

export default function MediaCardLink() {
  return (
    <div className="max-w-xs">
      <MediaCard href="#media-card-link" media={<img src={photo(0)} alt="" />} title="Bộ sưu tập mùa hè" meta="24 mẫu in" />
    </div>
  );
}
