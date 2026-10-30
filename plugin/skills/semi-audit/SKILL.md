---
name: semi-audit
description: Analyze an existing web project before adopting or refactoring to the Semi Design System (@semi/ui). Produces a structured report, asks the user targeted multiple-choice questions for ambiguous refactoring decisions, and creates a phased refactor plan. Triggered by /semi-audit or automatically by /semi-init on existing codebases.
---

# Audit Existing Project for Semi Design System (`/semi-audit`)

Use this skill when the user invokes `/semi-audit`, or as Step 1 of `/semi-init` when the target directory already contains an existing web codebase.

## Workflow

### Step 1: Run the deterministic audit script
Run `audit.mjs` on the project root (or `web/` subfolder):
```bash
node "<path-to-this-skill>/scripts/audit.mjs" --cwd "<project-or-web-dir>"
```
Add `--json` if you want the raw JSON alongside the Markdown summary.

The script scans:
- **Stack & dependencies:** Next.js version, React version, Tailwind CSS version (v3 vs v4), third-party UI libraries (`@mui/*`, `antd`, `@chakra-ui/*`, `@radix-ui/*`, `shadcn`, `styled-components`, `@emotion/*`, `lucide-react`).
- **Hard-coded colours & tokens:** Hex colours (`#...`, `bg-[#...]`), legacy grey surfaces (`bg-gray-800/900`, `border-gray-700`), off-scale radii (`rounded-md`), and typography (`text-xs/sm`, `font-bold`) mapped to the nearest Semi token by RGB distance.
- **Duplicate components:** Local components whose name/purpose overlaps with `@semi/ui` (`Icon`, `Chip`, `Pills`, `CustomSelect`, `CustomCombobox`, `NumberInput`, `DatePicker`, `SearchInput`, `Pagination`, `SidePanel`, `Skeleton`, `AppHeader`, `Modal`/`Dialog`, `Button`), including import/usage count across the codebase.
- **Violations by directory:** Hard vs ratchet rule counts using `semi-lint` rules.
- **Dark mode & UI language:** Checks whether dark mode and Vietnamese UI copy are already in use.

### Step 2: Present summary & ask targeted questions
Do **not** ask generic questions. Ask multiple-choice questions (using `ask_question` if available) for items that `audit.mjs` flagged under **Questions Requiring User Decision**:
1. **Next.js & Tailwind CSS version (always asked):** Default to `(Recommended) Latest versions (next@latest + tailwindcss@latest)`, or let the user keep current versions / pick specific versions.
2. **Duplicate components:** For overlapping local components with high usage, replace directly with `@semi/ui`, keep as a thin wrapper around `@semi/ui`, or keep separate?
3. **Custom brand / hex colours:** Map non-standard brand hex colours to Semi's default `#00AE42` primary palette, or override `--color-primary-*` in the project's `@theme`?
4. **Third-party UI libraries:** If MUI / Ant / shadcn / Chakra is present, phase out gradually per screen or replace all in this refactor?
5. **Refactor scope:** Refactor the entire app now, only specific routes/modules, or install tokens + `@semi/ui` with a baseline first (new code follows Semi, old code ratcheted)?

### Step 3: Propose the 4-phase refactor plan and wait for approval
Present a concise 4-phase plan based on the user's answers:
- **Phase 1 — Install & Tokens (zero visual regression):** Run `init.mjs --install-only` to install `@semi/ui`, wire `@semi/ui/tokens.css` + `@semi/ui/base.css` + `@source` into `globals.css`, add `transpilePackages: ["@semi/ui"]`, and verify `npm run build` + `tsc`.
- **Phase 2 — Surface, Colour & Typography Tokens:** Replace hard-coded hex classes, `bg-gray-800/900`, `rounded-md`, `font-bold`, and `text-xs/sm` with Semi tokens and `@semi/ui/styles` constants (`CARD`, `BTN_PRIMARY`, `MODAL_*`).
- **Phase 3 — Component Migration (one component family per commit):** Replace duplicate local components (`Select` → `CustomSelect`, `NumberInput`, `DatePicker`, `Chip`, `Pills`, `Skeleton`, `confirmDialog`, `Icon`) and verify build after each step.
- **Phase 4 — Lock in `semi-lint`:** Generate `semi-lint.json` and `semi-lint-baseline.json` (`npx semi-lint --update-baseline`), hook `semi-lint` into CI / `check.sh`, and update `AGENTS.md`.

Wait for user confirmation before executing Phase 1–4.
