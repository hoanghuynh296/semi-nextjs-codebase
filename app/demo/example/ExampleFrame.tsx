"use client";

import React, { useEffect, useState } from "react";
import { DOCS } from "../../../examples/registry.generated";
import { PageTitle } from "../../../src/PageTitle";
import { useTheme } from "../../../src/ThemeProvider";

type Theme = Parameters<ReturnType<typeof useTheme>["setTheme"]>[0];

/** The props a route-file example (layout, error.tsx…) gets from Next.js, filled with sample values. */
const DEMO_ERROR = Object.assign(new Error("Không tải được dữ liệu"), { digest: "demo-4f2a" });

/** What a layout example shows as its page (`children`). */
function SamplePage() {
  return (
    <div className="space-y-3">
      <PageTitle title="Trang mẫu" />
      <p className="text-ui text-body">Nội dung của trang hiện ở đây; layout bao quanh nó.</p>
    </div>
  );
}

type AnyProps = Record<string, unknown>;

/**
 * A root layout or global-error example renders its own <html> and <body>; this page already has them, so show what
 * they hold: <head> is dropped, <body> becomes a div with its classes.
 */
function unwrapDocument(node: React.ReactNode): React.ReactNode {
  if (!React.isValidElement<AnyProps>(node)) return node;
  if (node.type === "html") return React.Children.map(node.props.children as React.ReactNode, unwrapDocument);
  if (node.type === "head") return null;
  if (node.type === "body") return <div className={node.props.className as string | undefined}>{node.props.children as React.ReactNode}</div>;
  return node;
}

/**
 * An example of the docs alone, full screen: what an example with `preview: "none"` previews in its iframe (#206).
 * The app's API that examples call (`/api/…`) answers with a sample after a short wait, links stay on this page,
 * and the theme follows the docs page around the frame.
 */
export function ExampleFrame({ id, file }: { id: string; file: string }) {
  const example = DOCS.find((d) => d.id === id)?.examples.find((e) => e.file === file);
  const { setTheme } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The example's own effects run after this one only because it renders after `ready`: mock first.
    const real = window.fetch;
    window.fetch = async (input, init) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, window.location.href);
      if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/")) return real(input, init);
      await new Promise((r) => setTimeout(r, 800));
      return new Response(JSON.stringify({ ok: true, seen: false }), { status: 200, headers: { "content-type": "application/json" } });
    };
    // A link of the example (href="/orders") would leave the frame for a page this site does not have.
    const here = window.location.pathname;
    const stay = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      const to = new URL(a.href, window.location.href);
      if (to.origin === window.location.origin && to.pathname === here) return;
      e.preventDefault();
    };
    window.addEventListener("click", stay, true);
    // The docs page around the frame changed the theme: follow it.
    const onStorage = (e: StorageEvent) => {
      if (e.key === "semi-theme" && (e.newValue === "dark" || e.newValue === "light" || e.newValue === "system")) setTheme(e.newValue as Theme);
    };
    window.addEventListener("storage", onStorage);
    setReady(true);
    return () => {
      window.fetch = real;
      window.removeEventListener("click", stay, true);
      window.removeEventListener("storage", onStorage);
    };
  }, [setTheme]);

  if (!example) return null;
  if (!ready) return null;
  const { Component } = example;
  const props: AnyProps = { children: <SamplePage />, error: DEMO_ERROR, reset: () => undefined };
  const rendersDocument = /<html[\s>]/.test(example.code);
  return (
    <div data-example-full={`${id}/${file}`} className="contents">
      {rendersDocument ? unwrapDocument((Component as (p: AnyProps) => React.ReactNode)(props)) : <Component {...props} />}
    </div>
  );
}
