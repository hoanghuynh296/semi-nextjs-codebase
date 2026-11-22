// app/(app)/loading.tsx: the shell stays and the content shimmers in the shape of the page (list, cards or detail).
import { PageSkeleton } from "@semi/ui";

export default function Loading() {
  return <PageSkeleton shape="list" />;
}
