---
name: semi-propose
description: Propose an enhancement, new component, token, or report an unmet requirement from a consumer project directly to the Semi Design System repository (hoanghuynh296/semi-nextjs-codebase). Analyzes gaps in the current project, structures a compliant feature request or issue, and publishes it via GitHub API or prefilled issue URL. Triggered by /semi-propose.
---

# Semi Design System Gap Proposal (`/semi-propose`)

Use this skill when an AI Agent working on any consumer project (such as Auton Platform, 3D Noobs Studio, IoT, BMCU, or a new project) finds that **`@semi/ui` or the `semi-design` plugin does not yet meet a specific UI requirement**, lacks a needed component, token, or icon, or encounters a blocker during implementation.

This skill bridges the consumer project and the core design system repository (`hoanghuynh296/semi-nextjs-codebase`), creating high-quality, standardized GitHub issues so the maintainers can generalize and incorporate the capability into the system.

---

## Workflow for the Proposing Agent

### 1. Scan the Consumer Project Context
Run the project scanner to collect stack versions and custom components built locally in the consumer app:
```bash
node "<path-to-plugin>/skills/semi-propose/scripts/propose.mjs" --scan --cwd "<project-dir>"
```
Identify:
- Installed `@semi/ui` version.
- Any custom components in `src/components/`, `components/`, or `app/components/` that had to be hand-crafted because `@semi/ui` lacked them (e.g. `TabsBadge`, `DateRangePicker`, `Stepper`, `MultiSelect`, `AudioWaveform`, `ContextMenu`).
- Workarounds currently used (e.g. inline SVGs, raw physical color classes, custom CSS).

### 2. Formulate the Structured Proposal
Structure the proposal following this standardized template:

```markdown
### 1. Consumer Project Context
- **Project:** [Project Name, e.g. Auton Platform / Storefront / IoT Dashboard]
- **Current `@semi/ui` Version:** [e.g. v0.3.0]
- **Stack:** [e.g. Next.js 16 + React 19 + Tailwind CSS 4]

### 2. Unmet Requirement & Real-World Problem
[Describe what the screen or workflow requires and exactly what is missing in @semi/ui.
Be specific: is it a missing component, an extra prop on an existing component, a semantic token, an icon, or a linter false positive?]

### 3. Current Workaround
[Include a brief code snippet of how the project is currently handling this requirement,
e.g. hand-written component, local helper, or temporary baseline skip.]
```tsx
// Current local workaround
```

### 4. Proposed Solution & API Design
[Propose a clean, idiomatic API conforming to Semi Design System principles:
- Component name, props interface, and default values
- Semantic Tokens to use (bg-panel, bg-field, text-contrast, text-body, border-line)
- Dual-theme behavior (how it looks in dark vs light mode)
- Standard radii (rounded-lg for controls, rounded-xl for cards)
- Icon semantics from docs/ICONS.md]

```tsx
// Proposed component signature
export interface ProposedComponentProps {
  // ...
}
```

### 5. Ecosystem Generalization Rationale
[Explain why this capability is not just a one-off business requirement for this app,
but a general primitive that benefits other apps across the Semi ecosystem (SaaS, E-Commerce, 3D/CAD, IoT, Admin dashboards).]

### 6. Semi UI Rules Compliance Checklist
- [x] Flat surfaces only (no gradients, no glow, no drop shadows `shadow-sm/md/lg`)
- [x] Semantic Tokens only (`bg-panel`, `bg-field`, `text-contrast`, `text-body`, `border-line` — no physical `bg-white` or `text-slate-900`)
- [x] Dual-theme compliant (renders correctly in both `[data-theme="dark"]` and `[data-theme="light"]`)
- [x] Typography: medium/semibold, explicit px sizes, `tabular-nums` for numbers
- [x] Radii: `rounded-lg` (controls), `rounded-xl` (cards), `rounded-2xl` (panels/modals), `rounded-full` (chips)
- [x] Icons: Uses standard `<Icon name="..." />` (stroke 1.75), no emojis or raw SVGs
```

### 3. Choose Issue Title and Category Label
Classify the issue using a clear prefix:
- `[Component Request]` (label: `component,ecosystem-proposal`)
- `[Token Request]` (label: `tokens,ecosystem-proposal`)
- `[Icon Request]` (label: `icons,ecosystem-proposal`)
- `[Lint Improvement]` (label: `lint,ecosystem-proposal`)
- `[Bug Report]` (label: `bug,ecosystem-proposal`)
- `[Enhancement]` (label: `enhancement,ecosystem-proposal`)

### 4. Publish the Issue to GitHub
Save the markdown proposal to a temporary file (e.g. `/tmp/semi-proposal.md`) and run:
```bash
node "<path-to-plugin>/skills/semi-propose/scripts/propose.mjs" --create \
  --title "[Category] Brief summary of proposal" \
  --file "/tmp/semi-proposal.md" \
  --labels "ecosystem-proposal,component"
```

**Outcomes:**
- If GitHub credentials (`GITHUB_TOKEN`, `GH_TOKEN`, or git credential helper) are active:
  The script automatically creates the issue and prints the Issue #Number and live GitHub URL.
- If unauthenticated / offline:
  The script automatically writes `SEMI_PROPOSAL.md` in the project root and outputs a clickable prefilled GitHub URL (`https://github.com/hoanghuynh296/semi-nextjs-codebase/issues/new?...`) for one-click submission.

### 5. Report Back to the User
Summarize the proposal created, link to the issue or `SEMI_PROPOSAL.md`, and inform the user that the Semi core team can now triage it using `/semi-triage`.
