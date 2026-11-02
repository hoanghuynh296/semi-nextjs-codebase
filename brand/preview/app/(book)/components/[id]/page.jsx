import list from "@semi/ui/examples/list.json";
import { ComponentPage } from "@semi/ui/site";
import brand from "../../../brand.json";

export function generateStaticParams() {
  return list.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `${list.find((d) => d.id === id)?.title ?? id} — ${brand.name}` };
}

export default async function Page({ params }) {
  const { id } = await params;
  return <ComponentPage id={id} />;
}
