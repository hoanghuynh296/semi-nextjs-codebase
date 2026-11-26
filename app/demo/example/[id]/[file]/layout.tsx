import type { Metadata } from "next";
import { ExampleFrame } from "../../ExampleFrame";

type Params = Promise<{ id: string; file: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id, file } = await params;
  return { title: `${id}/${file} · ví dụ toàn màn hình · Semi Design System` };
}

/**
 * One example with `preview: "none"` (AppShell, a root layout, a route file) full screen, without the docs shell: the
 * iframe of its preview on the component page (#206). A layout, since AppShell never renders from a page
 * (app-shell-in-page); the page itself is empty.
 */
export default async function ExampleFrameLayout({ children, params }: { children: React.ReactNode; params: Params }) {
  const { id, file } = await params;
  return (
    <>
      <ExampleFrame id={id} file={file} />
      {children}
    </>
  );
}
