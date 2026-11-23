"use client";

import { Menu, SemiLocaleProvider, en, useSemiLocale } from "@semi/ui";

function Probe() {
  const t = useSemiLocale();
  return (
    <span className="text-ui text-muted">
      close = <span className="text-strong">{t.close}</span> · search = <span className="text-strong">{t.search}</span>
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
