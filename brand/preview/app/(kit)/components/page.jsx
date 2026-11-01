import { PageTitle } from "@semi/ui";
import { ComponentIndex } from "@semi/ui/site";
import brand from "../../brand.json";

export const metadata = { title: `Component — ${brand.name}` };

export default function Components() {
  return (
    <>
      <div className="space-y-3">
        <PageTitle title="Component" />
        <p className="text-ui-lg text-body max-w-3xl leading-relaxed">
          Mọi component của Semi trong màu và font của {brand.name}. Mỗi trang có ví dụ chạy thật, code copy được và bảng API.
        </p>
      </div>
      <ComponentIndex />
    </>
  );
}
