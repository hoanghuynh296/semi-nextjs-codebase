"use client";

// UI strings of the Semi components (labels, aria-labels, placeholders). Vietnamese by default; wrap the app in
// <SemiLocaleProvider locale={en}> (or a partial override) for another language. A prop on a component always wins.
import React, { createContext, useContext, useMemo } from "react";

export const vi = {
  close: "Đóng",
  confirm: "Xác nhận",
  ok: "Đồng ý",
  cancel: "Huỷ",
  add: "Thêm mới",
  refresh: "Làm mới",
  loading: "Đang tải",
  select: "Chọn...",
  selectOrCreate: "Chọn hoặc nhập mới...",
  notListed: (value: string) => `Không có sẵn — bấm lưu để thêm "${value}"`,
  noOptions: "Không có lựa chọn",
  selectDate: "Chọn ngày",
  today: "Hôm nay",
  prevMonth: "Tháng trước",
  nextMonth: "Tháng sau",
  search: "Tìm kiếm…",
  clearSearch: "Xoá tìm kiếm",
  closeSearch: "Đóng tìm kiếm",
  navigation: "Điều hướng",
  views: "Chế độ xem",
  pagination: "Phân trang",
  prevPage: "Trang trước",
  nextPage: "Trang sau",
  collapsePanel: "Thu gọn bảng cài đặt",
  expandPanel: "Mở rộng bảng cài đặt",
  theme: "Giao diện",
  themeLight: "Sáng",
  themeDark: "Tối",
  themeSystem: "Hệ thống",
  toLight: "Chuyển sang giao diện sáng",
  toDark: "Chuyển sang giao diện tối",
  dismiss: "Bỏ qua",
  required: "bắt buộc",
  showMore: "Xem thêm",
  noData: "Chưa có dữ liệu",
  enterNumber: "Nhập số",
  actions: "Thao tác",
  breadcrumb: "Đường dẫn",
  home: "Về trang chủ",
  chatPlaceholder: "Hỏi bất cứ điều gì…",
  chatSend: "Gửi",
  chatStop: "Dừng",
  chatNewChat: "Cuộc trò chuyện mới",
  chatThinking: "Đang suy nghĩ",
  chatRetry: "Thử lại",
  chatResize: "Kéo để đổi độ rộng (nhấp đúp để đặt lại)",
  chatAnswerDone: "Đã trả lời xong",
  chatJumpToLatest: "Xuống tin nhắn mới nhất",
  copy: "Sao chép",
  copied: "Đã sao chép",
};

export type SemiStrings = typeof vi;

export const en: SemiStrings = {
  close: "Close",
  confirm: "Confirm",
  ok: "OK",
  cancel: "Cancel",
  add: "Add",
  refresh: "Refresh",
  loading: "Loading",
  select: "Select…",
  selectOrCreate: "Select or type a new value…",
  notListed: (value) => `Not listed — save to add "${value}"`,
  noOptions: "No options",
  selectDate: "Pick a date",
  today: "Today",
  prevMonth: "Previous month",
  nextMonth: "Next month",
  search: "Search…",
  clearSearch: "Clear search",
  closeSearch: "Close search",
  navigation: "Navigation",
  views: "Views",
  pagination: "Pagination",
  prevPage: "Previous page",
  nextPage: "Next page",
  collapsePanel: "Collapse panel",
  expandPanel: "Expand panel",
  theme: "Theme",
  themeLight: "Light",
  themeDark: "Dark",
  themeSystem: "System",
  toLight: "Switch to light theme",
  toDark: "Switch to dark theme",
  dismiss: "Dismiss",
  required: "required",
  showMore: "Show more",
  noData: "No data yet",
  enterNumber: "Enter a number",
  actions: "Actions",
  breadcrumb: "Breadcrumb",
  home: "Go to home",
  chatPlaceholder: "Ask anything…",
  chatSend: "Send",
  chatStop: "Stop",
  chatNewChat: "New chat",
  chatThinking: "Thinking",
  chatRetry: "Retry",
  chatResize: "Drag to resize (double-click to reset)",
  chatAnswerDone: "Answer complete",
  chatJumpToLatest: "Jump to latest message",
  copy: "Copy",
  copied: "Copied",
};

const LocaleContext = createContext<SemiStrings>(vi);

export function SemiLocaleProvider({ locale, children }: { locale: Partial<SemiStrings>; children: React.ReactNode }) {
  const parent = useContext(LocaleContext);
  const value = useMemo(() => ({ ...parent, ...locale }), [parent, locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Strings for the current locale (vi unless a SemiLocaleProvider says otherwise). */
export const useSemiLocale = () => useContext(LocaleContext);
