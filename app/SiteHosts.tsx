"use client";

// The docs site's toast, confirm and task hosts. The locale test page (/feedback-locale) mounts its own hosts under an
// English provider, so the site's are left out there instead of doubling every toast and dialog.
import { usePathname } from "next/navigation";
import { ToastHost } from "../src/Toast";
import { ConfirmHost } from "../src/confirmDialog";
import { TaskHost } from "../src/TaskHost";

export function SiteHosts() {
  if (usePathname()?.startsWith("/feedback-locale")) return null;
  return (
    <>
      <ToastHost label="Thông báo nổi" />
      <ConfirmHost />
      <TaskHost />
    </>
  );
}
