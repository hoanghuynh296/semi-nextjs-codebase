import { PageTitle } from "../../../../src/PageTitle";

// `tracking-[0.37em]` is a class only this app folder uses: it proves the app's @source lines in semi.css put the
// migrated files' classes in the `semi` layer too.
export function StagedPage({ id }: { id: string }) {
  return (
    <div className="flex flex-col gap-section">
      <PageTitle title={id === "orders" ? "Đơn hàng" : "Khách hàng"} />
      <p data-testid="staged-app-class" className="text-ui text-body tracking-[0.37em]">Nội dung trang.</p>
    </div>
  );
}
