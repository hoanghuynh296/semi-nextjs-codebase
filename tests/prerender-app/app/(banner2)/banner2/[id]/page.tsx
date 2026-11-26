import { PageTitle } from "../../../../../../src/PageTitle";

export function generateStaticParams() {
  return [{ id: "orders" }, { id: "news" }];
}

export default async function Banner2Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-section">
      <PageTitle title={id === "news" ? "Tin mới" : "Đơn hàng"} />
      <p className="text-ui text-body">Nội dung trang.</p>
    </div>
  );
}
