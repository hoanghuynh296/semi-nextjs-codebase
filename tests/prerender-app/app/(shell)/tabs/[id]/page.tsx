import { Suspense } from "react";
import { TabsHarness, TabsSearchProbe } from "../../TabsHarness";

async function Id({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <p>Tabs {id}</p>;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <TabsHarness />
      <Suspense fallback={<p>Loading</p>}>
        <TabsSearchProbe />
        <Id params={params} />
      </Suspense>
    </>
  );
}
