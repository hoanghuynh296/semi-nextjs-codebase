// Staged migration (#184): the legacy sheet first, Semi's scoped sheet after (production order in the proposer's app).
import "./legacy.css";
import "./semi.css";
import { StagedShell } from "./StagedShell";

export default function StagedLayout({ children }: { children: React.ReactNode }) {
  return <StagedShell base="staged">{children}</StagedShell>;
}
