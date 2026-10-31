"use client";

import React, { useState } from "react";
import { StorybookShell } from "../StorybookShell";
import { PageTitle } from "../../src/PageTitle";
import { SubpageToolbar } from "../../src/SubpageToolbar";
import { SearchInput } from "../../src/SearchInput";
import { CustomSelect } from "../../src/CustomSelect";
import { CustomCombobox } from "../../src/CustomCombobox";
import { NumberInput } from "../../src/NumberInput";
import { DatePicker } from "../../src/DatePicker";
import { Chip, TONE_DOT } from "../../src/Chip";
import { Badge } from "../../src/Badge";
import { Pills } from "../../src/Pills";
import { KpiCard } from "../../src/KpiCard";
import { Pagination } from "../../src/Pagination";
import { RefreshButton } from "../../src/RefreshButton";
import { ExternalLink } from "../../src/ExternalLink";
import { Modal } from "../../src/Modal";
import { confirmDialog, ConfirmHost } from "../../src/confirmDialog";
import { SkeletonCard, SkeletonRows } from "../../src/Skeleton";
import { Icon } from "../../src/Icon";
import { ThemeSwitcher, ThemeToggle, useTheme } from "../../src/ThemeProvider";
import { Card } from "../../src/Card";
import { BTN_PRIMARY, BTN_SECONDARY, BTN_DANGER, BTN_ICON } from "../../styles/buttons";
import { FIELD_LABEL, FIELD_INPUT } from "../../styles/surfaces";
import { Field, Input, Textarea } from "../../src/Field";

const GITHUB_URL = "https" + "://github.com/hoanghuynh296/semi-nextjs-codebase";

/** A fixed-theme preview: data-theme on any element re-scopes every semantic token inside it. */
function ThemeScopePreview({ theme }: { theme: "dark" | "light" }) {
  return (
    <div data-theme={theme} className={`${theme} p-3 rounded-xl bg-canvas border border-line space-y-2`}>
      <span className="text-caption font-medium text-muted block">data-theme=&quot;{theme}&quot;</span>
      <Card className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-ui font-semibold text-contrast">Bento card</span>
          <Badge tone="emerald" dot>
            Online
          </Badge>
        </div>
        <p className="text-label text-body">Body text trên bg-panel.</p>
        <p className="text-caption text-muted">Muted caption · <span className="text-accent-fg">accent link</span></p>
        <div className="flex gap-2">
          <button type="button" className={BTN_PRIMARY}>
            <Icon name="check" />
            Lưu
          </button>
          <button type="button" className={BTN_DANGER}>
            <Icon name="trash" />
            Xoá
          </button>
        </div>
      </Card>
    </div>
  );
}

function ThemeState() {
  const { theme, resolvedTheme } = useTheme();
  return (
    <span className="text-label text-muted tabular-nums">
      theme = <span className="text-contrast font-medium">{theme}</span> · resolvedTheme ={" "}
      <span className="text-contrast font-medium">{resolvedTheme}</span>
    </span>
  );
}

export default function ComponentsShowcasePage() {
  // State for interactive controls
  const [filterSearch, setFilterSearch] = useState("");
  const [selectValue, setSelectValue] = useState("bambu_x1c");
  const [comboboxValue, setComboboxValue] = useState("pla_matte");
  const [numberVal, setNumberVal] = useState(220);
  const [selectedDate, setSelectedDate] = useState("2026-10-31");
  const [activePill, setActivePill] = useState("all");
  const [activeChip, setActiveChip] = useState("pla");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmResult, setConfirmResult] = useState<string | null>(null);

  const printerOptions = [
    { value: "bambu_x1c", label: "Bambu Lab X1-Carbon (0.4 Nozzle)" },
    { value: "bambu_p1s", label: "Bambu Lab P1S Combo" },
    { value: "bambu_a1_mini", label: "Bambu Lab A1 Mini (Bed Slinger)" },
    { value: "voron_24", label: "Voron 2.4 R2 Custom (350mm)" },
  ];

  const filamentOptions = [
    { value: "pla_matte", label: "eSUN PLA Matte Charcoal Black" },
    { value: "petg_hf", label: "Bambu PETG-HF White" },
    { value: "abs_fire", label: "Polymaker ABS Fire Red" },
    { value: "tpu_95a", label: "Inland TPU 95A Neon Orange" },
  ];

  const handleRefresh = async () => {
    await new Promise((r) => setTimeout(r, 800));
  };

  const handleTriggerConfirm = async () => {
    const ok = await confirmDialog({
      title: "Xác nhận xoá bản in mẫu?",
      message: "Thao tác này sẽ xoá tệp G-code và dữ liệu lát cắt vĩnh viễn khỏi bộ nhớ máy in.",
      confirmLabel: "Xoá vĩnh viễn",
      tone: "danger",
    });
    setConfirmResult(ok ? "Người dùng đã bấm XÁC NHẬN XOÁ" : "Người dùng đã HUỶ THAO TÁC");
  };

  return (
    <StorybookShell>
      <ConfirmHost />

      {/* Title */}
      <div className="space-y-3 pb-2 border-b border-line/60">
        <PageTitle title="Components & Patterns Showcase" />
        <p className="text-ui text-muted max-w-3xl leading-relaxed">
          Tập hợp đầy đủ các component chuẩn của hệ sinh thái Semi UI (<code className="text-accent-fg">@semi/ui</code>).
          Tuân thủ nguyên tắc Bento layout, dark-first flat surfaces, sentence case labels, và 100% không dùng control native hay glow blob.
        </p>
      </div>

      {/* Pattern 0: Theme */}
      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2 className="text-title font-semibold text-body flex items-center gap-2">
            <Icon name="sun" className="w-4 h-4 text-warning-fg" />
            <span>0. Theme (Sáng · Tối · Hệ thống)</span>
          </h2>
          <span className="text-caption text-muted pl-6 sm:pl-0 sm:text-right">ThemeScript · ThemeProvider</span>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-line space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <ThemeSwitcher showLabels />
            <ThemeSwitcher />
            <ThemeToggle />
            <ThemeState />
          </div>
          <p className="text-label text-muted">
            Đổi theme ở đây hoặc ở chân sidebar; lựa chọn được lưu (localStorage &quot;semi-theme&quot;) và áp trước khi trang hiển thị nhờ ThemeScript.
            Hai khung dưới cố định theme bằng data-theme để so sánh cùng lúc.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ThemeScopePreview theme="light" />
            <ThemeScopePreview theme="dark" />
          </div>
        </div>
      </section>

      {/* Pattern 1: SubpageToolbar */}
      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2 className="text-title font-semibold text-body flex items-center gap-2">
            <Icon name="sliders" className="w-4 h-4 text-accent-fg" />
            <span>1. SubpageToolbar (Thanh công cụ trang chuẩn)</span>
          </h2>
          <span className="text-caption text-muted pl-6 sm:pl-0 sm:text-right">STICKY_TOOLBAR Pattern</span>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-line space-y-3">
          <p className="text-label text-muted">
            Toolbar chuẩn luôn có bộ lọc bên trái và nhóm nút thao tác (Search, Refresh, Nút thêm mới dạng icon-only BTN_ICON) ở bên phải:
          </p>
          <div className="p-2 rounded-xl bg-canvas border border-line">
            <SubpageToolbar
              left={
                <div className="flex items-center gap-2">
                  <Pills
                    options={[
                      { key: "all", label: "Tất cả" },
                      { key: "active", label: "Đang in" },
                      { key: "idle", label: "Chờ lệnh" },
                    ]}
                    value={activePill}
                    onChange={setActivePill}
                  />
                </div>
              }
              right={
                <div className="flex items-center gap-2">
                  <SearchInput
                    value={filterSearch}
                    onChange={setFilterSearch}
                    placeholder="Lọc danh sách máy in..."
                    className="w-44 sm:w-60"
                  />
                  <RefreshButton onRefresh={handleRefresh} />
                  <button
                    type="button"
                    onClick={() => alert("Bấm nút tạo mới!")}
                    title="Thêm máy in mới"
                    className={`${BTN_PRIMARY} ${BTN_ICON}`}
                  >
                    <Icon name="plus" />
                  </button>
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* Pattern 2: Action Buttons */}
      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2 className="text-title font-semibold text-body flex items-center gap-2">
            <Icon name="zap" className="w-4 h-4 text-warning-fg" />
            <span>2. Button System (Các biến thể nút bấm)</span>
          </h2>
          <span className="text-caption text-muted font-medium">@semi/ui/styles</span>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-line space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={BTN_PRIMARY}>
              <Icon name="play" />
              <span>Bắt đầu in (BTN_PRIMARY)</span>
            </button>

            <button type="button" className={BTN_SECONDARY}>
              <Icon name="edit" />
              <span>Chỉnh sửa thông số (BTN_SECONDARY)</span>
            </button>

            <button type="button" className={BTN_DANGER}>
              <Icon name="trash" />
              <span>Xoá vĩnh viễn (BTN_DANGER)</span>
            </button>

            <button type="button" title="Ghim ưu tiên" className={`${BTN_SECONDARY} ${BTN_ICON}`}>
              <Icon name="pin" />
            </button>

            <button type="button" title="Xuất báo cáo" className={`${BTN_SECONDARY} ${BTN_ICON}`}>
              <Icon name="download" />
            </button>

            <ExternalLink href={GITHUB_URL}>
              <span>Mở GitHub repo</span>
            </ExternalLink>
          </div>
        </div>
      </section>

      {/* Pattern 3: Form Controls */}
      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2 className="text-title font-semibold text-body flex items-center gap-2">
            <Icon name="edit" className="w-4 h-4 text-tone-sky" />
            <span>3. Form Controls & Custom Inputs (Không dùng control native)</span>
          </h2>
          <span className="text-caption text-muted pl-6 sm:pl-0 sm:text-right">Dark-first Form Components</span>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-line">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CustomSelect */}
            <Field label="Chọn máy in đích (CustomSelect)">
              <CustomSelect
                variant="field"
                options={printerOptions}
                value={selectValue}
                onChange={setSelectValue}
              />
            </Field>

            {/* CustomCombobox */}
            <Field label="Cuộn nhựa / Vật liệu (Combobox)">
              <CustomCombobox
                options={filamentOptions}
                value={comboboxValue}
                onChange={setComboboxValue}
                placeholder="Tìm loại nhựa..."
              />
            </Field>

            {/* NumberInput */}
            <Field label="Nhiệt độ đầu phun (NumberInput °C)">
              <NumberInput
                className={FIELD_INPUT}
                value={numberVal}
                onChange={(e) => setNumberVal(Number(e.target.value) || 0)}
                min={180}
                max={300}
                step={5}
              />
            </Field>

            {/* DatePicker */}
            <div className="space-y-1.5">
              <span className={FIELD_LABEL}>Hẹn giờ ngày in (DatePicker)</span>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                ariaLabel="Hẹn giờ ngày in"
              />
            </div>
          </div>

          {/* Standard Input & Textarea */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-4 border-t border-line/60">
            <Field label="Tên bản in 3D (Input / FIELD_INPUT)" hint="Input dùng bề mặt bg-field với viền border-line.">
              <Input defaultValue="Voron_Stealthburner_Main_Body_v2.gcode" />
            </Field>
            <Field label="Ghi chú quy trình in (Textarea / FIELD_TEXTAREA)">
              <Textarea rows={2} defaultValue="In 4 vách ngoài (wall loops), 25% gyroid infill, quạt 60%." />
            </Field>
          </div>
        </div>
      </section>

      {/* Pattern 4: KPI Cards & Data */}
      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2 className="text-title font-semibold text-body flex items-center gap-2">
            <Icon name="chart" className="w-4 h-4 text-success-fg" />
            <span>4. KPI Cards & Metrics</span>
          </h2>
          <span className="text-caption text-muted pl-6 sm:pl-0 sm:text-right">18px–22px Tabular Numbers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Tổng sản lượng in"
            value="1.842 chi tiết"
            sub="+12.4% so với tuần trước"
            tone="good"
            icon="box"
            iconTone="green"
          />
          <KpiCard
            label="Doanh thu dịch vụ in"
            value="48.250.000 ₫"
            sub="+8.6% so với tháng trước"
            tone="good"
            icon="coin"
            iconTone="pink"
          />
          <KpiCard
            label="Tổng giờ máy chạy"
            value="5.420 giờ"
            sub="-2.1% tối ưu thời gian"
            tone="danger"
            icon="clock"
            iconTone="sky"
          />
          <KpiCard
            label="Tỉ lệ in thành công"
            value="98.7%"
            sub="+0.5% đạt chỉ tiêu"
            tone="good"
            icon="check"
            iconTone="violet"
          />
        </div>

        {/* Pagination demo */}
        <div className="p-3 rounded-xl bg-panel border border-line flex flex-wrap items-center justify-between gap-2">
          <span className="text-label text-muted">Component Pagination (Phân trang):</span>
          <Pagination
            page={currentPage}
            pages={8}
            onChange={setCurrentPage}
          />
        </div>
      </section>

      {/* Pattern 5: Chips, Pills & Tones */}
      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2 className="text-title font-semibold text-body flex items-center gap-2">
            <Icon name="tag" className="w-4 h-4 text-tone-violet" />
            <span>5. Chips & Status Indicators</span>
          </h2>
          <span className="text-caption text-muted pl-6 sm:pl-0 sm:text-right">Semi Tonal Coding</span>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-line space-y-4">
          <div>
            <div className="text-label font-medium text-muted mb-2">Dual-Theme Tonal Badges (&lt;Badge tone="..."&gt;):</div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="purple" icon="sparkles">Pro Plan</Badge>
              <Badge tone="blue" icon="shield">Enterprise</Badge>
              <Badge tone="emerald" dot>Hoàn thành</Badge>
              <Badge tone="amber" dot>Đang xử lý</Badge>
              <Badge tone="rose" dot>Thất bại</Badge>
              <Badge tone="sky" icon="server">Sync Cloud</Badge>
              <Badge tone="gray">Nháp</Badge>
            </div>
          </div>

          <div>
            <div className="text-label font-medium text-muted mb-2">Toggle Filter Chips (&lt;Chip tone="..."&gt;):</div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="purple" active={activeChip === "pla"} onClick={() => setActiveChip("pla")}>
                <span>Bambu Lab PLA (Tím)</span>
              </Chip>
              <Chip tone="pink" active={activeChip === "petg"} onClick={() => setActiveChip("petg")}>
                <span>PETG Translucent</span>
              </Chip>
              <Chip tone="sky" active={activeChip === "cam"} onClick={() => setActiveChip("cam")}>
                <span>Camera Online</span>
              </Chip>
              <Chip tone="amber" active={activeChip === "led"} onClick={() => setActiveChip("led")}>
                <span>Đèn LED 100%</span>
              </Chip>
              <Chip tone="emerald" active={activeChip === "auto"} onClick={() => setActiveChip("auto")}>
                <span>Auto Flow Rate</span>
              </Chip>
            </div>
          </div>
        </div>
      </section>

      {/* Pattern 6: Modals & Confirmation */}
      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2 className="text-title font-semibold text-body flex items-center gap-2">
            <Icon name="alert" className="w-4 h-4 text-danger-fg" />
            <span>6. Modals & Dialogs (Không dùng alert/confirm native)</span>
          </h2>
          <span className="text-caption text-muted pl-6 sm:pl-0 sm:text-right">Modal Portal & ConfirmHost</span>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-line space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={BTN_SECONDARY}
            >
              <Icon name="sliders" />
              <span>Mở Modal Bento mẫu</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerConfirm}
              className={BTN_DANGER}
            >
              <Icon name="trash" />
              <span>Thử nghiệm confirmDialog()</span>
            </button>

            {confirmResult && (
              <span className="text-label font-medium text-accent-fg px-3 py-1.5 rounded-lg bg-panel/[0.05] border border-line">
                {confirmResult}
              </span>
            )}
          </div>
        </div>

        {/* Live Modal */}
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Cấu hình thông số in nâng cao"
        >
          <div className="space-y-4">
            <p className="text-ui text-body leading-relaxed">
              Modal của Semi sử dụng lớp nền <code className="text-accent-fg">bg-field</code> với bán kính <code className="text-accent-fg">rounded-2xl</code>, có header và nút đóng chuẩn Semantic Icon.
            </p>

            <Field label="Tốc độ in lớp đầu tiên (First Layer Speed)">
              <Input defaultValue="50 mm/s" />
            </Field>

            <Field label="Độ dày lát cắt (Layer Height)">
              <Input defaultValue="0.20 mm Standard" />
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={BTN_SECONDARY}
              >
                Huỷ bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Đã lưu cấu hình!");
                  setIsModalOpen(false);
                }}
                className={BTN_PRIMARY}
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </Modal>
      </section>

      {/* Pattern 7: Shimmer Skeletons */}
      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2 className="text-title font-semibold text-body flex items-center gap-2">
            <Icon name="clock" className="w-4 h-4 text-tone-sky" />
            <span>7. Skeletons (Dùng Shimmer thay vì thông báo tải)</span>
          </h2>
          <span className="text-caption text-muted pl-6 sm:pl-0 sm:text-right">Shimmer Placeholder</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-panel border border-line space-y-2">
            <span className="text-caption text-muted font-medium block">SkeletonCard (Khung card đang nạp dữ liệu):</span>
            <SkeletonCard />
          </div>
          <div className="p-4 rounded-xl bg-panel border border-line space-y-2">
            <span className="text-caption text-muted font-medium block">SkeletonRows (Hàng bảng dữ liệu):</span>
            <SkeletonRows count={3} />
          </div>
        </div>
      </section>
    </StorybookShell>
  );
}
