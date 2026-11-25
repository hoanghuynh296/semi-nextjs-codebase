import React from "react";
import Link from "next/link";
import { PageTitle } from "../../src/PageTitle";
import { TAG } from "../../src/Chip";
import { CARD, SECTION_HEAD, SECTION_TITLE } from "../../styles/surfaces";
import { FOUNDATIONS } from "../../site/foundations.generated";
import { FOCUS_RING } from "../../styles/utils";

export default function FoundationsPage() {
  return (
    <>
      <div className="space-y-3">
        <PageTitle title="Foundations" />
        <p className="text-ui text-muted max-w-3xl">
          Token bề mặt, bậc chữ, hình khối và thang chữ của Semi cho cả hai theme sáng và tối. Bộ icon theo ngữ nghĩa nằm ở trang{" "}
          <Link href="/icons/" className={`text-strong underline underline-offset-2 rounded-chip ${FOCUS_RING}`}>
            Icons
          </Link>
          .
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className={TAG}>Tailwind 4 @theme</span>
          <span className={TAG}>Sáng và tối</span>
          <span className={TAG}>tokens/tokens.json</span>
        </div>
      </div>

      {/* Surfaces, text and shape: read from tokens/ (site/foundations.generated.ts) */}
      <section id="surfaces" className="space-y-4">
        <div className={SECTION_HEAD}>
          <h2 className={SECTION_TITLE}>Bề mặt và chữ</h2>
          <span className="text-ui text-muted">Giá trị theo từng theme</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {FOUNDATIONS.surfaces.map((t) => (
            <div key={t.key} className={`p-card rounded-card ${t.cls} border border-line space-y-2`}>
              {/* text-body, not muted: muted is for page surfaces and misses 4.5:1 on raised-2 (a pill, never a text ground) */}
              <span className="text-ui font-medium text-strong block">{t.cls}</span>
              <div className="text-ui text-body tabular-nums">Tối {t.dark}</div>
              <div className="text-ui text-body tabular-nums">Sáng {t.light}</div>
              <p className="text-ui text-body">{t.note}</p>
            </div>
          ))}
        </div>

        <div className={`${CARD} divide-y divide-divider`}>
          {FOUNDATIONS.text.map((t) => (
            <div key={t.key} className="grid gap-2 px-card py-2.5 text-ui sm:grid-cols-[180px_1fr_auto] sm:items-center">
              <code className="text-body">{t.cls}</code>
              <span className="text-muted">{t.note}</span>
              <span className="text-ui text-muted tabular-nums">
                {t.dark} · {t.light}
              </span>
            </div>
          ))}
        </div>

        <h3 className="text-lead font-medium text-strong pt-2">Hình khối</h3>
        <div className={`${CARD} p-card space-y-3 max-w-xl`}>
          <p className="text-ui text-muted">Một diện mạo cho mọi brand (tokens.json &quot;shape&quot;).</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-ui">
            <dt className="text-muted">Bo góc</dt>
            <dd className="text-body tabular-nums">{[FOUNDATIONS.shape.radius.chip, FOUNDATIONS.shape.radius.control, FOUNDATIONS.shape.radius.card, FOUNDATIONS.shape.radius.panel].join(" · ")}</dd>
            <dt className="text-muted">Control</dt>
            <dd className="text-body tabular-nums">{FOUNDATIONS.shape.controlHeight} · ô nhập {FOUNDATIONS.shape.fieldHeight}</dd>
            <dt className="text-muted">Viền card</dt>
            <dd className="text-body break-all">{FOUNDATIONS.shape.cardBorder}</dd>
            <dt className="text-muted">Font</dt>
            <dd className="text-body">{FOUNDATIONS.shape.fonts.join(" + ")}</dd>
            <dt className="text-muted">Độ đậm tiêu đề</dt>
            <dd className="text-body tabular-nums">{FOUNDATIONS.shape.titleWeight}</dd>
          </dl>
        </div>
        <p className="text-ui text-muted">
          Bo góc luôn dùng tên token: <code className="text-body">rounded-chip</code> · <code className="text-body">rounded-control</code> ·{" "}
          <code className="text-body">rounded-card</code> · <code className="text-body">rounded-panel</code>. Không dùng rounded-lg hay rounded-[Npx] (semi-lint).
        </p>
      </section>

      <section id="typography" className="space-y-4">
        <div className={SECTION_HEAD}>
          <h2 className={SECTION_TITLE}>Thang chữ</h2>
          <span className="text-ui text-muted">Weight theo từng bậc trong tokens.json</span>
        </div>

        <div className={`${CARD} divide-y divide-divider`}>
          {FOUNDATIONS.type.map((t) => (
            <div key={t.cls} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-card py-2.5">
              <code className="text-ui text-muted w-40 shrink-0">{t.cls}</code>
              <span className="text-ui text-muted tabular-nums w-20 shrink-0">{t.size}</span>
              <span className={`${t.cls} text-strong font-medium min-w-0`}>Máy in X1 Carbon · 12.450.000 ₫</span>
            </div>
          ))}
        </div>
        <p className="text-ui text-muted">
          Số đo, tiền, giờ luôn <code className="text-body">tabular-nums</code>. Tiêu đề trang dùng <code className="text-body">PageTitle</code> (text-hero, font-medium).
        </p>
      </section>
    </>
  );
}
