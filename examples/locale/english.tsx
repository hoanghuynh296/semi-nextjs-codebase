"use client";

import { Menu, SemiLocaleProvider, en, useSemiLocale } from "@semi/ui";

function Probe() {
  const t = useSemiLocale();
  return (
    <span className="text-label text-muted">
      close = <span className="text-contrast">{t.close}</span> · search = <span className="text-contrast">{t.search}</span>
    </span>
  );
}

export default function LocaleEnglish() {
  return (
    <div className="space-y-3">
      <Probe />
      <SemiLocaleProvider locale={en}>
        <div className="flex items-center gap-3">
          <Probe />
          <Menu items={[{ label: "Rename", icon: "edit", onSelect: () => undefined }]} />
        </div>
      </SemiLocaleProvider>
    </div>
  );
}
