// 1.0.0 (#147, T5): tabs — PillTabs, SegmentedControl and big TextTabs.
// Pills, PageTabsTitle and Tabs variant="segmented" stay exported (deprecated) so apps keep compiling; this migration
// flags them and any leftover `.text-tabs-strong` stand-in CSS for hand migration because SegmentedControl and PillTabs
// require an accessible `label` and carry different props.
export const version = "1.0.0";
export const id = "tabs";
export const description =
  'Flag deprecated Pills, PageTabsTitle, Tabs variant="segmented", and leftover .text-tabs-strong stand-ins for migration to PillTabs, SegmentedControl, or big TextTabs';

const importsFromSemi = (src, name) =>
  [...src.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']@semi\/ui(?:\/styles)?["']/g)].some((m) =>
    new RegExp(`(^|[\\s,])${name}(?=[\\s,]|$)`).test(m[1]),
  );

/** Hand fixes to report for one source file. */
export function tabFlags(src, file = "") {
  const flags = [];
  if (/\.(tsx?|jsx?|mdx?)$/.test(file) || !file) {
    if (importsFromSemi(src, "Pills") && /<Pills\b/.test(src)) {
      flags.push('Pills is deprecated in 1.0: use SegmentedControl (with `label`, 2–5 filter values) or PillTabs (5+ sections or sections with icons)');
    }
    if (importsFromSemi(src, "PageTabsTitle") && /<PageTabsTitle\b/.test(src)) {
      flags.push("PageTabsTitle is deprecated in 1.0: use TextTabs (2–4 top-level views, display face with brand underline) or PillTabs (5+ sections)");
    }
    if (importsFromSemi(src, "Tabs") && /<Tabs\b[^>]*\bvariant=(?:"segmented"|'segmented'|\{\s*["']segmented["']\s*\})/.test(src)) {
      flags.push('Tabs variant="segmented" is deprecated in 1.0: use SegmentedControl (filter values) or PillTabs (section panels)');
    }
  }
  if (/(?<![\w-])\.?text-tabs-strong\b/.test(src)) {
    flags.push("remove .text-tabs-strong stand-in: TextTabs ships the 1.0 display look and brand underline in @semi/ui");
  }
  return [...new Set(flags)];
}

export default function migrate({ files, read, flag }) {
  for (const f of files) {
    if (!/\.(tsx?|jsx?|mdx?|css)$/.test(f)) continue;
    if (flag) for (const msg of tabFlags(read(f), f)) flag(f, msg);
  }
}
