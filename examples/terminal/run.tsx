"use client";

import { useEffect, useState } from "react";
import { Button, Terminal } from "@semi/ui";

const LINES = ["> semi-docs@0.12.0 build", "> next build", "", "  Next.js 16", "  Creating an optimized production build", "  Compiled successfully", "  Generating static pages (128/128)", "", "Done in 14.2s"];

export default function TerminalRun() {
  const [n, setN] = useState(LINES.length);
  const running = n < LINES.length;
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setN((x) => x + 1), 400);
    return () => clearTimeout(id);
  }, [running, n]);
  return (
    <div className="flex flex-col gap-3 max-w-xl">
      <Terminal command="npm run build" output={LINES.slice(0, n).join("\n")} status={running ? "running" : "done"} exitCode={0} maxHeight={220} />
      <Terminal command="npm test" output={"FAIL tests/queue.test.ts\n1 failed, 42 passed"} exitCode={1} />
      <div>
        <Button size="sm" variant="secondary" icon="play" onClick={() => setN(0)}>
          Chạy lại
        </Button>
      </div>
    </div>
  );
}
