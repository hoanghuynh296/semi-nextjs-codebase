import { StagedPage } from "../../../(staged)/StagedPage";

export function generateStaticParams() {
  return [{ id: "orders" }, { id: "other" }];
}

export default async function Staged2Route({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StagedPage id={id} />;
}
