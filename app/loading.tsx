// Shown while a docs page loads: the shell stays and the content area shimmers (§13b).
import { PageSkeleton } from "../src/Skeleton";

export default function Loading() {
  return <PageSkeleton shape="list" inShell />;
}
