import { Suspense } from "react";

async function Id({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <p>Shell {id}</p>;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Loading</p>}>
      <Id params={params} />
    </Suspense>
  );
}
