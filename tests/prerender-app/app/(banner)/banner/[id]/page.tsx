import { PageTitle } from "../../../../../../src/PageTitle";

export function generateStaticParams() {
  return [{ id: "orders" }, { id: "other" }];
}

export default async function BannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-section">
      <PageTitle title={id === "orders" ? "Đơn hàng" : "Khách hàng"} />
      <p className="text-ui text-body">Nội dung trang.</p>
    </div>
  );
}
