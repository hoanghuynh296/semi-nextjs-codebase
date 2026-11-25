# Settings page

A 1.0 settings page on Page layout="reading" (centred max 1536px inside 16px card padding, 64px bottom) with PillTabs section navigation and one save action per section. Copy it with `semi add settings-page`.

## When to use

- Account, workspace or device settings.

## Examples

### Workspace settings

```tsx
"use client";

import { useState } from "react";
import {
  Button,
  Card,
  confirmDialog,
  CustomSelect,
  Field,
  Input,
  Item,
  ItemGroup,
  Page,
  PageSection,
  PillTabs,
  Switch,
  toast,
  type IconName,
} from "@semi/ui";

type SectionKey = "general" | "notifications" | "integrations" | "danger";

const SECTIONS: { key: SectionKey; label: string; icon: IconName }[] = [
  { key: "general", label: "Chung", icon: "settings" },
  { key: "notifications", label: "Thông báo", icon: "bell" },
  { key: "integrations", label: "Tích hợp", icon: "zap" },
  { key: "danger", label: "Vùng nguy hiểm", icon: "shield" },
];

export default function SettingsPage() {
  const [section, setSection] = useState<SectionKey>("general");
  const [name, setName] = useState("Xưởng in A");
  const [lang, setLang] = useState("vi");
  const [notify, setNotify] = useState(true);
  const [digest, setDigest] = useState(false);
  const [webhook, setWebhook] = useState("https://hooks.semi.vn/orders");
  const error = name.trim().length < 3 ? "Tên cần ít nhất 3 ký tự." : undefined;

  return (
    <Page
      layout="reading"
      title="Cấu hình"
      tabs={<PillTabs label="Mục cấu hình" value={section} onChange={setSection} items={SECTIONS} />}
      intro="Thiết lập chung cho không gian làm việc, thông báo và tích hợp."
    >
      {section === "general" && (
        <PageSection title="Không gian làm việc">
          <Card className="flex flex-col gap-4">
            <div className="grid gap-4 @2xl:grid-cols-2">
              <Field label="Tên" required error={error}>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Ngôn ngữ">
                <CustomSelect
                  variant="field"
                  value={lang}
                  onChange={setLang}
                  options={[
                    { value: "vi", label: "Tiếng Việt" },
                    { value: "en", label: "English" },
                  ]}
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" disabled={Boolean(error)} onClick={() => toast.success("Đã lưu cấu hình chung")}>
                Lưu
              </Button>
            </div>
          </Card>
        </PageSection>
      )}

      {section === "notifications" && (
        <PageSection title="Thông báo">
          <ItemGroup label="Thông báo">
            <Item
              icon="bell"
              title="Khi in xong hoặc lỗi"
              description="Gửi tới ứng dụng và email"
              actions={<Switch checked={notify} onChange={setNotify} label={<span className="sr-only">Khi in xong hoặc lỗi</span>} />}
            />
            <Item
              icon="fileText"
              title="Báo cáo tuần"
              description="Thứ Hai, 8:00"
              actions={<Switch checked={digest} onChange={setDigest} label={<span className="sr-only">Báo cáo tuần</span>} />}
            />
          </ItemGroup>
        </PageSection>
      )}

      {section === "integrations" && (
        <PageSection title="Tích hợp">
          <Card className="flex flex-col gap-4">
            <Field label="Webhook nhận sự kiện" kind="url">
              <Input value={webhook} onChange={(e) => setWebhook(e.target.value)} />
            </Field>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => toast.success("Đã lưu webhook")}>
                Lưu
              </Button>
            </div>
          </Card>
        </PageSection>
      )}

      {section === "danger" && (
        <PageSection title="Vùng nguy hiểm">
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lead font-medium text-strong">Xoá không gian làm việc</h3>
              <p className="text-ui text-muted">Xoá mọi máy in, đơn và lịch sử. Không thể khôi phục.</p>
            </div>
            <Button
              variant="danger"
              icon="trash"
              onClick={async () => {
                if (await confirmDialog({ title: "Xoá Xưởng in A?", message: "Mọi dữ liệu sẽ bị xoá vĩnh viễn.", confirmLabel: "Xoá", tone: "danger" })) {
                  toast({ title: "Đã xoá", tone: "danger" });
                }
              }}
            >
              Xoá
            </Button>
          </Card>
        </PageSection>
      )}
    </Page>
  );
}
```

## API

## Accessibility

- Each section is a labelled ItemGroup; fields use Field (label, hint, error wired); the destructive action asks first (confirmDialog).

<!-- GENERATED by scripts/build-docs.mjs from examples/settings-page/ and the types in src/ -->
