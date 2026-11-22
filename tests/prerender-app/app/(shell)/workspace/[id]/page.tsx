import { Suspense } from "react";
import { Workspace } from "../../Workspace";

async function Id({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <p>Workspace {id}</p>;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Workspace />
      <Suspense fallback={<p>Loading</p>}>
        <Id params={params} />
      </Suspense>
    </>
  );
}
