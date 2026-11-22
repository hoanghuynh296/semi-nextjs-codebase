import { FeatureIntro, IconTile, type FeatureIntroStore } from "@semi/ui";

// "Seen" on the account: the app's own API (any async get / set works).
const accountStore: FeatureIntroStore = {
  get: async (id) => {
    const res = await fetch(`/api/me/intros/${id}`);
    return res.ok && (await res.json()).seen === true;
  },
  set: (id) => {
    void fetch(`/api/me/intros/${id}`, { method: "PUT" });
  },
};

export default function FeatureIntroStoreExample() {
  return (
    <FeatureIntro
      id="purchasing-workspace"
      store={accountStore}
      slides={[{ title: "Yêu cầu mua trên một màn hình", body: "Mặt hàng và nhà cung cấp bên trái, báo giá bên phải.", visual: <IconTile name="layers" size="lg" tone="gray" /> }]}
    />
  );
}
