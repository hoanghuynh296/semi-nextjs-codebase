import { EmptyState } from "@semi/ui";

export default function EmptyStateNoResults() {
  return <EmptyState variant="no-results" title="Không có máy in khớp bộ lọc" onClearFilters={() => {}} />;
}
