---
name: semi-propose
description: Propose an enhancement, new component, token, icon or lint fix from a consumer project to the Semi Design System repository (hoanghuynh296/semi-nextjs-codebase). Verifies the gap is real (not already shipped, not app-specific, not a duplicate), drafts a rule-compliant proposal, gets user approval, then files a GitHub issue. Use when @semi/ui cannot express a UI need instead of inventing local primitives. Triggered by /semi-propose.
---

# Semi Design System Gap Proposal (`/semi-propose`)

Use in a **consumer project** (Auton Platform, 3D Noobs Studio, IoT, BMCU, …) when `@semi/ui` cannot express a UI need:
missing component/prop, missing semantic token, missing icon, or a `semi-lint` false positive.
Goal: get the gap fixed **once in the design system** instead of forking a local primitive.

`SCRIPT="<this-skill-dir>/scripts/propose.mjs"`

## Step 1 — Verify the gap is real (do NOT skip)

```bash
node "$SCRIPT" --scan --cwd "<app-dir>"
```
Output: declared/installed/latest `@semi/ui`, stack versions, local primitive files (`components/**/Tabs.tsx`, …), and workarounds (inline `<svg><path>`, native `<select>`, `type="date|number"`).

Stop and do not file an issue if any of these hold:
| Finding | Instead |
|---|---|
| `semiUi.outdated: true` and the latest `CHANGELOG.md` already covers it | Recommend `/semi-update` |
| It exists already: check `node_modules/@semi/ui/docs/QUICK_REF.md`, `DESIGN_SYSTEM.md`, `ICONS.md` (aliases, too) and `src/index.ts` exports | Use the existing API |
| It is business logic (data fetching, domain state machines, app-specific workflows) | Build it locally on `@semi/ui/styles` and record it in the app's `docs/UI_EXTENSIONS.md` |
| The need only exists because the desired look breaks a Semi rule (gradients, shadows, white cards, `rounded-md`) | Explain the rule to the user and use the compliant pattern |

## Step 2 — Check for duplicates

```bash
node "$SCRIPT" --search "<2-4 keywords, e.g. date range picker>"
```
If an open issue matches, add a comment with your project's context (via the GitHub link) rather than filing a new issue.

## Step 3 — Draft the proposal

Write the draft to a temp file (e.g. `/tmp/semi-proposal.md`, never into the consumer repo) using **exactly these headings** (the triage audit parses them):

```markdown
### 1. Consumer Project Context
- Project / screen(s):
- `@semi/ui` version (installed → latest):
- Stack:

### 2. Unmet Requirement
What the screen needs and what exactly is missing (component / prop / token / icon / lint rule).

### 3. Current Workaround
Short snippet of the local code in use today (it may break rules; that is expected here).

### 4. Proposed Solution & API Design
Component/prop signature, defaults, which semantic tokens it uses, dark + light behaviour,
radius, icon names from ICONS.md. This section MUST itself be rule-compliant.

### 5. Ecosystem Generalization Rationale
Why at least one other kind of Semi app (SaaS, e-commerce, IoT, 3D, admin) needs the same primitive.

### 6. Semi Rules Checklist
- [ ] Semantic tokens only (no `bg-white`, `text-slate-*`, hex classes)
- [ ] Renders correctly in `data-theme="dark"` and `data-theme="light"`
- [ ] Flat: no gradients, glow or `shadow-sm/md/lg`
- [ ] `font-medium`/`font-semibold`, px sizes ≥ 11px, `tabular-nums` for numbers, sentence case
- [ ] Radii: `rounded-lg` / `rounded-xl` / `rounded-2xl` / `rounded-full`
- [ ] `<Icon name>`, `CustomSelect`, `DatePicker`, `NumberInput`, `confirmDialog` (no native controls)
```

Self-check the draft with the same audit the maintainers use (path is the sibling skill):
```bash
node "<plugin-dir>/skills/semi-triage/scripts/triage.mjs" --audit-file /tmp/semi-proposal.md
```
Fix every `violation` before continuing.

Title prefix + labels:
| Prefix | `--labels` |
|---|---|
| `[Component Request]` | `ecosystem-proposal,component` |
| `[Token Request]` | `ecosystem-proposal,tokens` |
| `[Icon Request]` | `ecosystem-proposal,icons` |
| `[Lint Improvement]` | `ecosystem-proposal,lint` |
| `[Bug Report]` | `ecosystem-proposal,bug` |
| `[Enhancement]` | `ecosystem-proposal,enhancement` |

## Step 4 — Get user approval, then publish

Filing an issue is an outward action on a shared repo: **show the user the title and draft and wait for explicit approval.**
Never include secrets, internal URLs, customer data or proprietary business logic in the body.

```bash
node "$SCRIPT" --create --title "[Component Request] DateRangePicker" --file /tmp/semi-proposal.md --labels "ecosystem-proposal,component"
```
- Authenticated: prints `issueNumber` + `url` (labels are dropped automatically if you lack permission to set them).
- `NO_TOKEN` / `NO_ACCESS` (repo is private): prints `savedTo` (temp file) and a prefilled `webUrl`. Give both to the user, plus the fix:
  `gh auth login && gh auth setup-git` (or export `GITHUB_TOKEN`). Do not try other ways around auth.

## Step 5 — Keep working and report

- While the issue is open, keep the local workaround minimal, compliant where possible, and mark it
  `// TODO(semi#<issue>): replace with @semi/ui <Name>` so `/semi-update` can find it later.
- If the workaround needs a lint exception, record it in `semi-lint-baseline.json` (`--update-baseline`), never a broad `skip`.
- Tell the user the issue link and that maintainers will review it with `/semi-triage`.
