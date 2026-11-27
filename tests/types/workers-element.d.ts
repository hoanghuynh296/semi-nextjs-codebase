// A stand-in for the Cloudflare Workers runtime types (`wrangler types` / @cloudflare/workers-types), which declare a
// global `interface Element` (the HTMLRewriter element) that merges with the DOM `Element`. @semi/ui ships source, so an
// app whose program loads both type-checks our src/ under this merge (ds#214). Kept to the members that change how DOM
// code type-checks; no dependency on the real package. Checked by tsconfig.workers.json (lint/test/workers-types.test.mjs).
interface Element {
  readonly removed: boolean;
  setAttribute(name: string, value: string): Element;
  removeAttribute(name: string): Element;
  before(content: string, options?: { html?: boolean }): Element;
  after(content: string, options?: { html?: boolean }): Element;
  prepend(content: string, options?: { html?: boolean }): Element;
  append(content: string, options?: { html?: boolean }): Element;
  replace(content: string, options?: { html?: boolean }): Element;
  remove(): Element;
  removeAndKeepContent(): Element;
  setInnerContent(content: string, options?: { html?: boolean }): Element;
}
