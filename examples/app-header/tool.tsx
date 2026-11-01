import { AppHeader, HEADER_ICON_BTN, HEADER_ICON_OFF, Icon, headerPrimary } from "@semi/ui";

export default function AppHeaderTool() {
  return (
    <div className="rounded-card border border-line overflow-hidden">
      <AppHeader title="Phối màu" productName="3D Noobs" logoIcon="palette" homeHref="#">
        <button type="button" className={`${HEADER_ICON_BTN} ${HEADER_ICON_OFF}`} aria-label="Trợ lý AI" title="Trợ lý AI">
          <Icon name="sparkles" className="w-4 h-4" />
        </button>
        <button type="button" className={headerPrimary(true)}>
          Xong
        </button>
      </AppHeader>
    </div>
  );
}
