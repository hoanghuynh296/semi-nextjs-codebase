import { Suspense } from "react";

// A dynamic route with NO route-level loading.tsx and no generateStaticParams that covers every id: a loading.tsx
// wraps the page in Suspense and would hide a layout that is not safe on its own (the PR #78 lesson). The page reads
// `params` inside its own Suspense, so the only thing that can fail this build is the root layout (ToastHost, #82).
async function Id({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main>Prerendered {id}</main>;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main>Loading</main>}>
      <Id params={params} />
    </Suspense>
  );
}
