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
  Pills,
  Switch,
  toast,
} from "@semi/ui";

type SectionKey = "general" | "notifications" | "integrations" | "danger";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "general", label: "Chung" },
  { key: "notifications", label: "Thông báo" },
  { key: "integrations", label: "Tích hợp" },
  { key: "danger", label: "Vùng nguy hiểm" },
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
      tabs={<Pills value={section} onChange={setSection} options={SECTIONS} />}
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
