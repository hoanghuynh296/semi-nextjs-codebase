#!/usr/bin/env node
/**
 * triage.mjs
 * 
 * Helper script for /semi-triage skill.
 * - Lists and views ecosystem proposal issues from hoanghuynh296/semi-nextjs-codebase.
 * - Audits proposal text against Semi Design System rules (flat surfaces, tokens, typography, radii).
 * - Posts architectural reviews and verdicts back to GitHub issues via REST API.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const REPO_OWNER = "hoanghuynh296";
const REPO_NAME = "semi-nextjs-codebase";
const GITHUB_API = "https://api.github.com";

// --- Parse CLI arguments ---
const args = process.argv.slice(2);
function getArg(flag, defaultValue = null) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return defaultValue;
}
const hasFlag = (flag) => args.includes(flag);

const isList = hasFlag("--list");
const issueId = getArg("--issue");
const isAudit = hasFlag("--audit");
const commentIssueId = getArg("--comment");
const commentBody = getArg("--body");
const commentFile = getArg("--file");
const closeIssueId = getArg("--close");
const closeReason = getArg("--reason", "completed");
const addLabelsStr = getArg("--add-labels");
const labelIssueId = getArg("--label-issue");

// --- Token helper ---
function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim();
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN.trim();
  try {
    const out = execSync("printf \"protocol=https\\nhost=github.com\\n\" | git credential fill 2>/dev/null", { encoding: "utf8" });
    const m = out.match(/^password=(.+)$/m);
    if (m && m[1]) return m[1].trim();
  } catch {}
  return null;
}

// --- Fetch helpers ---
async function githubFetch(endpoint, options = {}) {
  const token = getGitHubToken();
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "semi-triage-agent",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers
  });
  return res;
}

// --- List Issues ---
async function listIssues(state = "open") {
  const res = await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=${state}&per_page=30`);
  if (!res.ok) {
    throw new Error(`Failed to list issues: ${res.status} ${res.statusText}`);
  }
  const issues = await res.json();
  return issues.filter(i => !i.pull_request).map(i => ({
    number: i.number,
    title: i.title,
    author: i.user?.login,
    state: i.state,
    labels: i.labels.map(l => l.name),
    commentsCount: i.comments,
    createdAt: i.created_at,
    url: i.html_url
  }));
}

// --- View Single Issue ---
async function viewIssue(id) {
  const res = await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch issue #${id}: ${res.status} ${res.statusText}`);
  }
  const issue = await res.json();

  // Fetch comments if any
  let comments = [];
  if (issue.comments > 0) {
    const cRes = await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${id}/comments`);
    if (cRes.ok) {
      const cData = await cRes.json();
      comments = cData.map(c => ({
        author: c.user?.login,
        body: c.body,
        createdAt: c.created_at
      }));
    }
  }

  return {
    number: issue.number,
    title: issue.title,
    author: issue.user?.login,
    state: issue.state,
    labels: issue.labels.map(l => l.name),
    body: issue.body,
    createdAt: issue.created_at,
    url: issue.html_url,
    comments
  };
}

// --- Audit Rule Compliance ---
function auditProposalText(text) {
  const findings = {
    violations: [],
    cautions: [],
    positives: [],
    score: "PASS"
  };

  if (!text) return findings;

  // Check physical palette
  const physicalMatch = text.match(/\b(bg|text|border)-(?:white(?!\/)|black(?!\/)|(?:slate|gray|zinc|neutral|stone)-\d{2,3})\b/g);
  if (physicalMatch) {
    findings.violations.push({
      rule: "no-literal-palette",
      message: `Contains raw physical color classes: ${Array.from(new Set(physicalMatch)).join(", ")}. Must use Semantic Tokens (bg-panel, bg-field, text-contrast, text-body, border-line).`
    });
  }

  // Check drop shadows & glow
  const shadowMatch = text.match(/\bshadow-(?:sm|md|lg|xl|2xl|\[0_0_)\b/g);
  if (shadowMatch) {
    findings.violations.push({
      rule: "no-drop-shadows",
      message: `Mentions drop shadows: ${Array.from(new Set(shadowMatch)).join(", ")}. Semi Design System is Flat Bento UI using border-line rather than drop shadows.`
    });
  }

  // Check gradients
  const gradientMatch = text.match(/\b(bg-gradient|from-|to-|via-)\b/g);
  if (gradientMatch) {
    findings.violations.push({
      rule: "no-gradients",
      message: `Mentions gradients (${Array.from(new Set(gradientMatch)).join(", ")}). Semi surfaces are flat restrained surfaces.`
    });
  }

  // Check radius rounded-md
  if (/\brounded-md\b/.test(text)) {
    findings.violations.push({
      rule: "no-rounded-md",
      message: "Mentions `rounded-md`. Semi radius scale is 8px (`rounded-lg`), 12px (`rounded-xl`), 16px (`rounded-2xl`), or `rounded-full`."
    });
  }

  // Check font-bold
  if (/\bfont-bold\b/.test(text)) {
    findings.cautions.push({
      rule: "typography-weight",
      message: "Mentions `font-bold`. Semi typography standardizes on `font-medium` (UI/labels) and `font-semibold` (headings/values)."
    });
  }

  // Check native controls
  if (/<select\b|<input[^>]*type=["'](?:date|number)["']/.test(text)) {
    findings.violations.push({
      rule: "no-native-controls",
      message: "Mentions native `<select>`, `type=\"date\"`, or `type=\"number\"`. Must use `@semi/ui` CustomSelect, DatePicker, or NumberInput."
    });
  }

  // Positives check
  if (/bg-panel|bg-field|text-contrast|text-body|border-line/.test(text)) {
    findings.positives.push("Explicitly references Semi Semantic Tokens.");
  }
  if (/data-theme|ThemeProvider|dark|light/i.test(text)) {
    findings.positives.push("Considers Dual-Theme (Dark + Light mode) compatibility.");
  }
  if (/AppShell|SubpageToolbar|KpiCard|Modal/.test(text)) {
    findings.positives.push("Integrates cleanly with Bento Layout structures.");
  }

  if (findings.violations.length > 0) {
    findings.score = "NEEDS_REVISION";
  }

  return findings;
}

// --- Post Comment ---
async function postComment(id, body) {
  const res = await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${id}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Failed to post comment: ${res.status} ${data.message || res.statusText}`);
  }
  return res.json();
}

// --- Add Labels ---
async function addLabels(id, labels) {
  const labelList = labels.split(",").map(s => s.trim()).filter(Boolean);
  const res = await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${id}/labels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ labels: labelList })
  });
  if (!res.ok) {
    throw new Error(`Failed to add labels: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// --- Close Issue ---
async function closeIssue(id, reason = "completed") {
  const res = await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: "closed", state_reason: reason })
  });
  if (!res.ok) {
    throw new Error(`Failed to close issue: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// --- Main CLI ---
async function main() {
  if (isList) {
    const state = getArg("--state", "open");
    const issues = await listIssues(state);
    console.log(JSON.stringify(issues, null, 2));
    return;
  }

  if (issueId) {
    const issue = await viewIssue(issueId);
    if (isAudit) {
      issue.ruleAudit = auditProposalText(issue.body);
    }
    console.log(JSON.stringify(issue, null, 2));
    return;
  }

  if (commentIssueId) {
    let body = commentBody;
    if (!body && commentFile) {
      body = fs.readFileSync(path.resolve(process.cwd(), commentFile), "utf8");
    }
    if (!body) {
      console.error(JSON.stringify({ error: "Missing --body or --file for comment" }));
      process.exit(1);
    }
    const comment = await postComment(commentIssueId, body);
    console.log(JSON.stringify({ success: true, commentId: comment.id, htmlUrl: comment.html_url }, null, 2));
    return;
  }

  if (labelIssueId && addLabelsStr) {
    const labels = await addLabels(labelIssueId, addLabelsStr);
    console.log(JSON.stringify({ success: true, labels }, null, 2));
    return;
  }

  if (closeIssueId) {
    const closed = await closeIssue(closeIssueId, closeReason);
    console.log(JSON.stringify({ success: true, state: closed.state, number: closed.number }, null, 2));
    return;
  }

  // Help
  console.log(`Semi Triage CLI
Usage:
  node triage.mjs --list [--state open|closed|all]
  node triage.mjs --issue <id> [--audit]
  node triage.mjs --comment <id> (--body "text" | --file <path>)
  node triage.mjs --label-issue <id> --add-labels "accepted,enhancement"
  node triage.mjs --close <id> [--reason completed|not_planned]
`);
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }, null, 2));
  process.exit(1);
});
