// Staged migration (#184): Semi's scoped sheet first, the legacy sheet after (the dev order that broke AppShell).
import "./semi.css";
import "./legacy.css";
import { StagedShell } from "../(staged)/StagedShell";

export default function Staged2Layout({ children }: { children: React.ReactNode }) {
  return <StagedShell base="staged2">{children}</StagedShell>;
}
