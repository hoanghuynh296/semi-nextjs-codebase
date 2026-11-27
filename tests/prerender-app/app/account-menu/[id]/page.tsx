import { AccountShell } from "./AccountShell";

export function generateStaticParams() {
  return [{ id: "own" }, { id: "missing" }];
}

export default async function AccountMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AccountShell id={id} />;
}
