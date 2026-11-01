"use client";

import React, { useState } from "react";
import { Badge } from "../src/Badge";
import { Button } from "../src/Button";
import { PageTitle } from "../src/PageTitle";
import { Table, TBody, TD, TH, THead, TR } from "../src/Table";
import { CARD, SECTION_HEAD, SECTION_TITLE } from "../styles/surfaces";
import { DOCS } from "../examples/registry.generated";
import { CodeBlock } from "./CodeBlock";
import { ExampleBlock } from "./ExampleBlock";

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <div className={SECTION_HEAD}>
      <h2 className={SECTION_TITLE}>{children}</h2>
    </div>
  );
}

/**
 * The page of one component doc: what it is, when to use it (and what instead), the import, live examples with
 * their exact code, the API from the TypeScript types, accessibility. "Copy page" copies the agent markdown.
 */
export function ComponentPage({ id, markdownHref }: { id: string; markdownHref?: string }) {
  const doc = DOCS.find((d) => d.id === id);
  const [copied, setCopied] = useState(false);
  if (!doc) return <p className="text-ui text-muted">Không có tài liệu “{id}”.</p>;
  const copyPage = () => {
    void navigator.clipboard?.writeText(doc.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <article className="@container space-y-8" data-doc={doc.id}>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-label text-muted">
          <span>{doc.group}</span>
          <span aria-hidden>/</span>
          <span className="text-body">{doc.title}</span>
        </div>
        <PageTitle title={doc.title} />
        <p className="text-ui-lg text-body max-w-3xl leading-relaxed">{doc.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" icon={copied ? "check" : "copy"} onClick={copyPage}>
            {copied ? "Đã copy" : "Copy page"}
          </Button>
          {markdownHref && (
            <a href={markdownHref} className="inline-flex items-center gap-1 text-label font-medium text-accent-fg hover:text-contrast">
              {doc.id}.md
            </a>
          )}
          <span className="ml-auto flex flex-wrap gap-1.5">
            {doc.components.map((c) => (
              <Badge key={c} tone="gray" size="sm">
                {c}
              </Badge>
            ))}
          </span>
        </div>
      </header>

      {(doc.when.length > 0 || doc.instead.length > 0) && (
        <section className="grid gap-3 @3xl:grid-cols-2">
          {doc.when.length > 0 && (
            <div className={`${CARD} p-4 space-y-2`}>
              <Heading>Khi nào dùng</Heading>
              <ul className="space-y-1.5 text-ui text-body list-disc pl-5">
                {doc.when.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {doc.instead.length > 0 && (
            <div className={`${CARD} p-4 space-y-2`}>
              <Heading>Dùng cái khác khi</Heading>
              <ul className="space-y-1.5 text-ui">
                {doc.instead.map((i) => (
                  <li key={i.need} className="flex flex-wrap gap-x-2">
                    <span className="text-body">{i.need}</span>
                    <span className="text-muted">→</span>
                    <span className="text-accent-fg font-medium">{i.use}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="space-y-2">
        <Heading>Import</Heading>
        <CodeBlock code={doc.imports} />
      </section>

      <section className="space-y-6">
        <Heading>Ví dụ</Heading>
        {doc.examples.map((ex) => (
          <ExampleBlock key={ex.file} id={doc.id} example={ex} />
        ))}
      </section>

      <section className="space-y-4">
        <Heading>API</Heading>
        {doc.api.map((a) => (
          <div key={a.name} className="space-y-2">
            <h3 className="text-title font-semibold text-contrast font-mono">{a.name}</h3>
            {a.description && <p className="text-label text-muted max-w-3xl">{a.description}</p>}
            {a.props.length ? (
              <div className={`${CARD} overflow-hidden`}>
                <Table>
                  <THead>
                    <TR>
                      <TH>Prop</TH>
                      <TH>Kiểu</TH>
                      <TH>Mặc định</TH>
                      <TH>Mô tả</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {a.props.map((p) => (
                      <TR key={p.name}>
                        <TD className="font-mono text-contrast">
                          {p.name}
                          {p.required && <span className="text-danger-fg"> *</span>}
                        </TD>
                        <TD wrap className="font-mono text-label text-body min-w-48 max-w-md">
                          {p.type}
                        </TD>
                        <TD className="font-mono text-label text-muted">{p.default ?? ""}</TD>
                        <TD wrap className="text-label text-body min-w-56">
                          {p.description}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            ) : (
              <p className="text-label text-muted">Không có prop riêng.</p>
            )}
          </div>
        ))}
      </section>

      {doc.a11y.length > 0 && (
        <section className="space-y-2">
          <Heading>Accessibility</Heading>
          <ul className="space-y-1.5 text-ui text-body list-disc pl-5">
            {doc.a11y.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      )}
      {doc.notes.length > 0 && (
        <section className="space-y-2">
          <Heading>Ghi chú</Heading>
          <ul className="space-y-1.5 text-ui text-body list-disc pl-5">
            {doc.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
