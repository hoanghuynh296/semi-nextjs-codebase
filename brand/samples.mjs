// Sample brands a core change of the generator is checked on (Design Lab "So sánh", `semi-brand compare`): colours
// that are hard for a different reason each, so a parameter that helps one brand and breaks another shows up before
// it ships. A sample is a brand.json without the guideline (generateBrand needs only these fields).
const base = (id, name, primary, why, extra = {}) => ({
  id,
  name,
  why,
  brand: {
    name,
    package: `@sample/${id}`,
    primary,
    fonts: { sans: "Geist" },
    ...extra,
  },
});

export const SAMPLES = [
  base("green", "Xanh lá", "#00AE42", "Brand mẫu của bộ test (tests/fixtures/brand.json), có màu phụ cam", { secondary: "#FF8A00" }),
  base("yellow", "Vàng", "#FFD600", "Rất sáng: chữ trắng không đọc được, nút dễ chìm trên nền sáng"),
  base("cyan", "Xanh ngọc nhạt", "#22D3EE", "Sáng và đậm sắc: nút dễ chìm trên nền sáng"),
  base("navy", "Navy", "#0B1F3A", "Rất tối: nút chìm trên nền tối (chữ trắng)"),
  base("red", "Đỏ", "#E11D48", "Trùng màu báo lỗi: chỉ cho nút chính, trạng thái giữ màu của Semi"),
  base("orange", "Cam", "#F97316", "Gần màu cảnh báo, chữ trắng vừa sát ngưỡng"),
  base("violet", "Tím xám", "#7C6F9B", "Ít sắc, độ sáng giữa: chữ trắng và chữ tối đều sát ngưỡng"),
  base("blue", "Xanh dương", "#2563EB", "Màu phổ biến nhất của app: chữ trắng vừa đạt"),
];
