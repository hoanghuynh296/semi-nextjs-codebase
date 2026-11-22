import { Suspense } from "react";
import { FiltersBar } from "../../FiltersBar";

async function Id({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <p>Filters {id}</p>;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <FiltersBar />
      <Suspense fallback={<p>Loading</p>}>
        <Id params={params} />
      </Suspense>
    </>
  );
}
