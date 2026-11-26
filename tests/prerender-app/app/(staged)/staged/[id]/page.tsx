import { StagedPage } from "../../StagedPage";

export function generateStaticParams() {
  return [{ id: "orders" }, { id: "other" }];
}

export default async function StagedRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StagedPage id={id} />;
}
