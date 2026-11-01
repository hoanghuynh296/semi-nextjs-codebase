import { AssistantMessage, Citation, Sources, type Source } from "@semi/ui";

const SOURCES: Source[] = [
  { title: "Hướng dẫn in PETG", href: "https://example.com/petg-guide", description: "Nhiệt độ, quạt và bàn nhiệt" },
  { title: "Bảng thông số vật liệu", href: "https://docs.example.com/materials" },
  { title: "Diễn đàn: PETG bị kéo sợi", href: "https://forum.example.com/t/petg-stringing" },
];

export default function SourcesAnswer() {
  return (
    <div className="max-w-xl">
      <AssistantMessage actions={<Sources sources={SOURCES} />}>
        In PETG ở 230–250°C<Citation n={1} source={SOURCES[0]} />, bàn nhiệt 70–80°C<Citation n={2} source={SOURCES[1]} />. Kéo sợi thường giảm khi tăng rút
        nhựa lên 1–2 mm<Citation n={3} source={SOURCES[2]} />.
      </AssistantMessage>
    </div>
  );
}
