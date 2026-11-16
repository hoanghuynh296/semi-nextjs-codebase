// app/(app)/loading.tsx: Next.js shows it inside the layout, so the shell stays and only the content shimmers.
import { PageSkeleton } from "@semi/ui";

export default function Loading() {
  return <PageSkeleton />;
}
