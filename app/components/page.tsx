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
import { Pills } from "../../src/Pills";
import { KpiCard } from "../../src/KpiCard";
import { Pagination } from "../../src/Pagination";
import { RefreshButton } from "../../src/RefreshButton";
import { ExternalLink } from "../../src/ExternalLink";
import { Modal } from "../../src/Modal";
import { confirmDialog, ConfirmHost } from "../../src/confirmDialog";
import { SkeletonCard, SkeletonRows } from "../../src/Skeleton";
import { Icon } from "../../src/Icon";
import { BTN_PRIMARY, BTN_SECONDARY, BTN_DANGER, BTN_ICON } from "../../styles/buttons";
import { FIELD_LABEL, FIELD_INPUT, FIELD_TEXTAREA } from "../../styles/surfaces";

const GITHUB_URL = "https" + "://github.com/hoanghuynh296/semi-nextjs-codebase";

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
        <p className="text-[13px] text-muted max-w-3xl leading-relaxed">
          Tập hợp đầy đủ các component chuẩn của hệ sinh thái Semi UI (<code className="text-primary-300">@semi/ui</code>).
          Tuân thủ nguyên tắc Bento layout, dark-first flat surfaces, sentence case labels, và 100% không dùng control native hay glow blob.
        </p>
      </div>

      {/* Pattern 1: SubpageToolbar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-body flex items-center gap-2">
            <Icon name="sliders" className="w-4 h-4 text-primary-400" />
            <span>1. SubpageToolbar (Thanh công cụ trang chuẩn)</span>
          </h2>
          <span className="text-[11px] text-muted">STICKY_TOOLBAR Pattern</span>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-line space-y-3">
          <p className="text-[12px] text-muted">
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
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-body flex items-center gap-2">
            <Icon name="zap" className="w-4 h-4 text-amber-400" />
            <span>2. Button System (Các biến thể nút bấm)</span>
          </h2>
          <span className="text-[11px] text-muted font-medium">@semi/ui/styles</span>
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
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-body flex items-center gap-2">
            <Icon name="edit" className="w-4 h-4 text-sky-400" />
            <span>3. Form Controls & Custom Inputs (Không dùng control native)</span>
          </h2>
          <span className="text-[11px] text-muted">Dark-first Form Components</span>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-line">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CustomSelect */}
            <div className="space-y-1.5">
              <label className={FIELD_LABEL}>Chọn máy in đích (CustomSelect)</label>
              <CustomSelect
                options={printerOptions}
                value={selectValue}
                onChange={setSelectValue}
              />
            </div>

            {/* CustomCombobox */}
            <div className="space-y-1.5">
              <label className={FIELD_LABEL}>Cuộn nhựa / Vật liệu (Combobox)</label>
              <CustomCombobox
                options={filamentOptions}
                value={comboboxValue}
                onChange={setComboboxValue}
                placeholder="Tìm loại nhựa..."
              />
            </div>

            {/* NumberInput */}
            <div className="space-y-1.5">
              <label className={FIELD_LABEL}>Nhiệt độ đầu phun (NumberInput °C)</label>
              <NumberInput
                value={numberVal}
                onChange={(e) => setNumberVal(Number(e.target.value) || 0)}
                min={180}
                max={300}
                step={5}
              />
            </div>

            {/* DatePicker */}
            <div className="space-y-1.5">
              <label className={FIELD_LABEL}>Hẹn giờ ngày in (DatePicker)</label>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
              />
            </div>
          </div>

          {/* Standard Input & Textarea */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-4 border-t border-line/60">
            <div className="space-y-1.5">
              <label className={FIELD_LABEL}>Tên bản in 3D (FIELD_INPUT)</label>
              <input
                type="text"
                defaultValue="Voron_Stealthburner_Main_Body_v2.gcode"
                className={FIELD_INPUT}
              />
              <span className="text-[11px] text-muted">Inputs luôn dùng FIELD_INPUT (bg-panel/[0.05]), không dùng bg-field</span>
            </div>
            <div className="space-y-1.5">
              <label className={FIELD_LABEL}>Ghi chú quy trình in (FIELD_TEXTAREA)</label>
              <textarea
                rows={2}
                defaultValue="In 4 vách ngoài (wall loops), 25% gyroid infill, quạt 60%."
                className={FIELD_TEXTAREA}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pattern 4: KPI Cards & Data */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-body flex items-center gap-2">
            <Icon name="chart" className="w-4 h-4 text-emerald-400" />
            <span>4. KPI Cards & Metrics</span>
          </h2>
          <span className="text-[11px] text-muted">18px–22px Tabular Numbers</span>
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
        <div className="p-3 rounded-xl bg-panel border border-line flex items-center justify-between">
          <span className="text-[12px] text-muted">Component Pagination (Phân trang):</span>
          <Pagination
            page={currentPage}
            pages={8}
            onChange={setCurrentPage}
          />
        </div>
      </section>

      {/* Pattern 5: Chips, Pills & Tones */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-body flex items-center gap-2">
            <Icon name="tag" className="w-4 h-4 text-violet-400" />
            <span>5. Chips & Status Indicators</span>
          </h2>
          <span className="text-[11px] text-muted">Semi Tonal Coding</span>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-line space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Chip active={activeChip === "pla"} onClick={() => setActiveChip("pla")}>
              <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT.green}`} />
              <span>Bambu Lab PLA</span>
            </Chip>
            <Chip active={activeChip === "petg"} onClick={() => setActiveChip("petg")}>
              <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT.pink}`} />
              <span>PETG Translucent</span>
            </Chip>
            <Chip active={activeChip === "cam"} onClick={() => setActiveChip("cam")}>
              <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT.sky}`} />
              <span>Camera Online</span>
            </Chip>
            <Chip active={activeChip === "led"} onClick={() => setActiveChip("led")}>
              <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT.amber}`} />
              <span>Đèn LED 100%</span>
            </Chip>
            <Chip active={activeChip === "auto"} onClick={() => setActiveChip("auto")}>
              <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT.violet}`} />
              <span>Auto Flow Rate</span>
            </Chip>
          </div>
        </div>
      </section>

      {/* Pattern 6: Modals & Confirmation */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-body flex items-center gap-2">
            <Icon name="alert" className="w-4 h-4 text-red-400" />
            <span>6. Modals & Dialogs (Không dùng alert/confirm native)</span>
          </h2>
          <span className="text-[11px] text-muted">Modal Portal & ConfirmHost</span>
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
              <span className="text-[12px] font-medium text-primary-300 px-3 py-1.5 rounded-lg bg-panel/[0.05] border border-line">
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
            <p className="text-[13px] text-body leading-relaxed">
              Modal của Semi sử dụng lớp nền <code className="text-primary-300">bg-field</code> với bán kính <code className="text-primary-300">rounded-2xl</code>, có header và nút đóng chuẩn Semantic Icon.
            </p>

            <div className="space-y-1.5">
              <label className={FIELD_LABEL}>Tốc độ in lớp đầu tiên (First Layer Speed)</label>
              <input type="text" defaultValue="50 mm/s" className={FIELD_INPUT} />
            </div>

            <div className="space-y-1.5">
              <label className={FIELD_LABEL}>Độ dày lát cắt (Layer Height)</label>
              <input type="text" defaultValue="0.20 mm Standard" className={FIELD_INPUT} />
            </div>

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
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-body flex items-center gap-2">
            <Icon name="clock" className="w-4 h-4 text-sky-400" />
            <span>7. Skeletons (Dùng Shimmer thay vì thông báo tải)</span>
          </h2>
          <span className="text-[11px] text-muted">Shimmer Placeholder</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-panel border border-line space-y-2">
            <span className="text-[11px] text-muted font-medium block">SkeletonCard (Khung card đang nạp dữ liệu):</span>
            <SkeletonCard />
          </div>
          <div className="p-4 rounded-xl bg-panel border border-line space-y-2">
            <span className="text-[11px] text-muted font-medium block">SkeletonRows (Hàng bảng dữ liệu):</span>
            <SkeletonRows count={3} />
          </div>
        </div>
      </section>
    </StorybookShell>
  );
}
