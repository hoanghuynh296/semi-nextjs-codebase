"use client";

// Test page of the feedback kit (tests/feedback-kit.spec.ts): the texts of confirmDelete and the undo toast come from
// the provider around the hosts, and ToastHost durationScale shortens or stretches every timer. Not linked from the menu.
import { Button, ConfirmHost, SemiLocaleProvider, ToastHost, confirmDelete, en, toast } from "../../src";

export default function FeedbackLocale() {
  return (
    <SemiLocaleProvider locale={en}>
      <ConfirmHost />
      <ToastHost label="Fast notifications" durationScale={0.1} hotkey="Ctrl+Alt+Y" />
      <div className="p-6 flex flex-wrap gap-2">
        <Button variant="danger" onClick={() => void confirmDelete({ name: "Server 1" })}>
          Delete server
        </Button>
        <Button onClick={() => toast.undo("Archived", () => {}, { duration: 0 })}>Archive</Button>
        <Button onClick={() => toast.info("Quick note")}>Quick note</Button>
      </div>
    </SemiLocaleProvider>
  );
}
