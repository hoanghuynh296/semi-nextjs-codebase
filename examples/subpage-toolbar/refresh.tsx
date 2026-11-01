import { RefreshButton } from "@semi/ui";

export default function RefreshButtonBasic() {
  return <RefreshButton onRefresh={() => new Promise((r) => setTimeout(r, 1000))} />;
}
