// Section frame shared by the Storybook pages (not part of @semi/ui).
import React from "react";
import { Icon, type IconName } from "../src/Icon";
import { ChatCopyButton } from "../src/Chat";
import { STORY_SECTIONS } from "./usage";

/** When to use it + copy-ready code for a section (app/usage.ts): read by people and by agents (also in llms.txt). */
export function StoryUsage({ id }: { id: string }) {
  const s = STORY_SECTIONS[id];
  if (!s) return null;
  return (
    <div className="space-y-2 min-w-0" data-story-usage={id}>
      <p className="text-label text-body">
        <span className="font-medium text-contrast">Khi nào dùng: </span>
        {s.when}
      </p>
      <div className="relative min-w-0">
        {/* focusable: it scrolls, keyboard users must be able to reach it */}
        <pre tabIndex={0} aria-label={`Code: ${s.title}`} className="max-h-72 overflow-auto rounded-lg bg-field border border-line p-3 pr-10 text-label leading-relaxed text-body font-mono outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50">
          <code>{s.code}</code>
        </pre>
        <div className="absolute top-1.5 right-1.5 rounded-lg bg-field">
          <ChatCopyButton text={s.code} />
        </div>
      </div>
    </div>
  );
}

export function ShowcaseSection({
  id,
  title,
  icon,
  meta,
  children,
}: {
  id?: string;
  title: string;
  icon: IconName;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-3 scroll-mt-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h2 className="text-title font-semibold text-body flex items-center gap-2">
          <Icon name={icon} className="w-4 h-4 text-accent-fg" />
          <span>{title}</span>
        </h2>
        {meta && <span className="text-caption text-muted pl-6 sm:pl-0 sm:text-right">{meta}</span>}
      </div>
      <div className="p-3 sm:p-4 rounded-xl bg-panel border border-line space-y-4 min-w-0">
        {children}
        {id && <StoryUsage id={id} />}
      </div>
    </section>
  );
}

/** Small caption above a demo row. */
export const DemoLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-caption text-muted font-medium block">{children}</span>
);
