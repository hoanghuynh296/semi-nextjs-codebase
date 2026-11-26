import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Every example whose meta says `preview: "none"` gets a full-screen route (static export). */
export function generateStaticParams() {
  const root = join(process.cwd(), "examples");
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => {
      let meta: { examples?: { file: string; preview?: string }[] };
      try {
        meta = JSON.parse(readFileSync(join(root, d.name, "meta.json"), "utf8"));
      } catch {
        return [];
      }
      return (meta.examples ?? []).filter((e) => e.preview === "none").map((e) => ({ id: d.name, file: e.file }));
    });
}

export const dynamicParams = false;

/** The example is the layout (AppShell renders from a layout only). */
export default function ExampleFramePage() {
  return null;
}
