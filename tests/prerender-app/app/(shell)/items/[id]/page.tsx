import { Suspense } from "react";
import { ItemsList } from "../../ItemsList";

async function Id({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <p>Items {id}</p>;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <ItemsList />
      <Suspense fallback={<p>Loading</p>}>
        <Id params={params} />
      </Suspense>
    </>
  );
}
