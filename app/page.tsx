import Link from "next/link";
import list from "../examples/list.generated.json";
import pkg from "../package.json";
import { PageTitle } from "../src/PageTitle";
import { Icon, type IconName } from "../src/Icon";
import { CARD, CARD_HOVER, SECTION_HEAD, SECTION_TITLE } from "../styles/surfaces";
import { CodeBlock } from "../site/CodeBlock";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

const AGENT_FILES: { href: string; title: string; text: string }[] = [
  { href: `${BASE}/llms.txt`, title: "llms.txt", text: "Mục lục cho agent: mọi trang và bản markdown của nó." },
  { href: `${BASE}/llms-full.txt`, title: "llms-full.txt", text: "Toàn bộ luật và mọi trang component trong một file." },
  { href: `${BASE}/docs/components/README.md`, title: "docs/components", text: "Mỗi component một file .md: khi nào dùng, dùng gì thay thế, ví dụ, API." },
  { href: `${BASE}/components.json`, title: "components.json", text: "Mọi export với prop, mô tả và trang doc của nó." },
];

const START: { href: string; icon: IconName; title: string; text: string }[] = [
  { href: "/components/", icon: "grid", title: "Component", text: `${list.length} trang, ví dụ chạy thật, API sinh từ TypeScript.` },
  { href: "/foundations/", icon: "palette", title: "Foundations", text: "Token bề mặt, thang chữ, bộ icon theo ngữ nghĩa." },
  { href: "/brand/", icon: "sparkles", title: "Brand preview", text: "Xem một thương hiệu trên mọi component trước khi tạo brand kit." },
];

const INSTALL = `npm install github:hoanghuynh296/semi-nextjs-codebase#v${pkg.version}

/* app/globals.css */
@import "tailwindcss";
@import "@semi/ui/tokens.css";
@import "@semi/ui/base.css";

// or let the agent do it: /semi-init (new app) · /semi-audit → /semi-fix (existing app)`;

export default function HomePage() {
  return (
    <>
      <div className="space-y-3">
        <PageTitle title="Semi Design System" />
        <p className="text-ui-lg text-body max-w-3xl leading-relaxed">
          Bộ kit gốc để làm phần mềm cho nhiều thương hiệu: component React (Next.js, Tailwind 4), token chạy cả sáng lẫn tối, ba style và brand kit cho từng
          thương hiệu. Mọi thứ viết cho agent dùng trước: mỗi component có ví dụ là file thật, bảng API sinh từ code và bản markdown để đọc không cần chạy trang.
        </p>
      </div>

      <section className="grid gap-3 @3xl:grid-cols-3">
        {START.map((s) => (
          <Link key={s.href} href={s.href} className={`${CARD_HOVER} p-4 space-y-2 outline-none focus-visible:ring-2 focus-visible:ring-focus`}>
            <Icon name={s.icon} className="w-5 h-5 text-accent-fg" />
            <div className="text-title font-semibold text-contrast">{s.title}</div>
            <p className="text-label text-muted">{s.text}</p>
          </Link>
        ))}
      </section>

      <section className="space-y-2">
        <div className={SECTION_HEAD}>
          <h2 className={SECTION_TITLE}>Cài đặt</h2>
        </div>
        <CodeBlock code={INSTALL} />
      </section>

      <section className="space-y-2">
        <div className={SECTION_HEAD}>
          <h2 className={SECTION_TITLE}>Cho agent</h2>
        </div>
        <div className={`${CARD} p-4 space-y-3`}>
          <p className="text-ui text-body max-w-3xl">
            Agent đọc file, không cần mở trang: chọn component trong <code className="text-accent-fg">docs/components/README.md</code>, đọc trang của nó, copy một
            ví dụ (import từ <code className="text-accent-fg">@semi/ui</code>), rồi chạy <code className="text-accent-fg">npx semi-lint</code>. Các file này cũng có
            trong <code className="text-accent-fg">node_modules/@semi/ui</code> sau khi cài.
          </p>
          <div className="grid gap-2 @2xl:grid-cols-2">
            {AGENT_FILES.map((f) => (
              <a key={f.title} href={f.href} className="rounded-control border border-line bg-field p-3 hover:border-line-hover transition">
                <div className="text-ui font-semibold text-accent-fg">{f.title}</div>
                <div className="text-label text-muted">{f.text}</div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
