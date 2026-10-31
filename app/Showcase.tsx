// Section frame shared by the Storybook pages (not part of @semi/ui).
import React from "react";
import { Icon, type IconName } from "../src/Icon";

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
      <div className="p-3 sm:p-4 rounded-xl bg-panel border border-line space-y-4 min-w-0">{children}</div>
    </section>
  );
}

/** Small caption above a demo row. */
export const DemoLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-caption text-muted font-medium block">{children}</span>
);
