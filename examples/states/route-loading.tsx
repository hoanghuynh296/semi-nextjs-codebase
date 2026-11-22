// app/(app)/loading.tsx: the shell stays and the content shimmers in the shape of the page (list, cards or detail).
// `inShell` drops the full-page height and padding, because the shell's content slot already gives them.
import { PageSkeleton } from "@semi/ui";

export default function Loading() {
  return <PageSkeleton shape="list" inShell />;
}
