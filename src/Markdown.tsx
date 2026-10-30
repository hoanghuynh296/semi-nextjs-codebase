"use client";

// Light markdown for AI answers: paragraphs, headings (as bold lines), lists, **bold**, `code`, links.
import React from "react";
import { ExternalLink } from "./ExternalLink";

const LINK = "text-primary-300 hover:text-primary-200 underline underline-offset-2 break-all";

function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/[^\s)<>]+[^\s)<>.,;:!?])/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
      return <code key={i} className="px-1 rounded bg-white/[0.08] text-[12px]">{part.slice(1, -1)}</code>;
    // Links go to other sites: a new tab, or the phone's browser inside the app
    const md = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (md) return <ExternalLink key={i} href={md[2]} className={LINK}>{md[1]}</ExternalLink>;
    if (/^https?:\/\//.test(part)) return <ExternalLink key={i} href={part} className={LINK}>{part}</ExternalLink>;
    return part;
  });
}

export function Markdown({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={blocks.length} className={`${list.ordered ? "list-decimal" : "list-disc"} pl-5 flex flex-col gap-0.5`}>
        {list.items.map((it, i) => <li key={i}>{inline(it)}</li>)}
      </Tag>
    );
    list = null;
  };
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const m = line.match(/^\s*(?:([-*•])|(\d+)[.)])\s+(.*)$/);
    if (m) {
      const ordered = Boolean(m[2]);
      if (list && list.ordered !== ordered) flush();
      if (!list) list = { ordered, items: [] };
      list.items.push(m[3]);
      continue;
    }
    flush();
    if (!line.trim()) continue;
    const h = line.match(/^#{1,4}\s+(.*)$/);
    blocks.push(
      <p key={blocks.length} className={h ? "font-semibold text-white" : ""}>
        {inline(h ? h[1] : line)}
      </p>
    );
  }
  flush();
  return <div className="flex flex-col gap-1.5">{blocks}</div>;
}
