import type { Metadata } from "next";
import list from "../../../examples/list.generated.json";
import { ComponentPage } from "../../../site/ComponentPage";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function generateStaticParams() {
  return list.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const doc = list.find((d) => d.id === id);
  return { title: `${doc?.title ?? id} — Semi Design System`, description: doc?.description };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <ComponentPage id={id} markdownHref={`${BASE}/docs/components/${id}.md`} />
    </>
  );
}
