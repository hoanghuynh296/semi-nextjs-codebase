#!/usr/bin/env node
/**
 * propose.mjs
 * 
 * Helper script for /semi-propose skill.
 * - Scans consumer project codebase for unmet UI needs and custom components.
 * - Formats standardized, high-quality GitHub issues for hoanghuynh296/semi-nextjs-codebase.
 * - Publishes the issue directly via GitHub REST API (using git credentials or GITHUB_TOKEN),
 *   or generates a pre-filled issue URL and local SEMI_PROPOSAL.md fallback.
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

const cwd = path.resolve(getArg("--cwd", process.cwd()));
const isScan = hasFlag("--scan");
const isCreate = hasFlag("--create");
const issueTitle = getArg("--title");
const issueBody = getArg("--body");
const issueBodyFile = getArg("--file");
const issueLabels = getArg("--labels", "ecosystem-proposal");
const proposalType = getArg("--type", "feature");

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

// --- Project Scanner ---
function scanProject(projectDir) {
  const result = {
    projectDir,
    name: path.basename(projectDir),
    semiUiVersion: null,
    nextVersion: null,
    tailwindVersion: null,
    customComponents: [],
    suspectedWrappers: [],
    unmetHints: []
  };

  const pkgPath = path.join(projectDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      result.name = pkg.name || result.name;
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      result.semiUiVersion = deps["@semi/ui"] || null;
      result.nextVersion = deps["next"] || null;
      result.tailwindVersion = deps["tailwindcss"] || null;
    } catch {}
  }

  // Scan for custom components
  const searchDirs = ["src/components", "components", "app/components", "src/app/components", "ui", "src/ui"];
  for (const relDir of searchDirs) {
    const fullDir = path.join(projectDir, relDir);
    if (fs.existsSync(fullDir)) {
      try {
        const files = fs.readdirSync(fullDir, { recursive: true });
        for (const file of files) {
          const ext = path.extname(file);
          if ([".tsx", ".jsx", ".ts", ".js"].includes(ext) && !file.endsWith(".d.ts")) {
            const baseName = path.basename(file, ext);
            result.customComponents.push({
              name: baseName,
              relPath: path.join(relDir, file)
            });

            // Check if name matches common design system primitives
            const knownPrimitives = [
              "Button", "Modal", "Dialog", "Select", "Combobox", "Dropdown",
              "Tabs", "Table", "Pagination", "Card", "Badge", "Chip", "Pill",
              "Tooltip", "Popover", "Drawer", "SidePanel", "Accordion", "Slider",
              "DateRange", "Calendar", "Upload", "Toast", "Stepper", "AudioPlayer"
            ];
            if (knownPrimitives.some(p => baseName.toLowerCase().includes(p.toLowerCase()))) {
              result.suspectedWrappers.push(baseName);
            }
          }
        }
      } catch {}
    }
  }

  return result;
}

// --- Create Issue via GitHub REST API ---
async function createGitHubIssue({ title, body, labels }) {
  const token = getGitHubToken();
  const labelList = labels ? labels.split(",").map(s => s.trim()).filter(Boolean) : [];

  if (!token) {
    return {
      success: false,
      reason: "NO_TOKEN",
      message: "No GitHub token found in GITHUB_TOKEN, GH_TOKEN, or git credential helper."
    };
  }

  try {
    const res = await fetch(`${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "semi-design-agent"
      },
      body: JSON.stringify({
        title,
        body,
        labels: labelList
      })
    });

    const data = await res.json();
    if (res.status === 201) {
      return {
        success: true,
        issueNumber: data.number,
        htmlUrl: data.html_url,
        title: data.title
      };
    } else {
      return {
        success: false,
        reason: "API_ERROR",
        status: res.status,
        message: data.message || JSON.stringify(data)
      };
    }
  } catch (err) {
    return {
      success: false,
      reason: "NETWORK_ERROR",
      message: err.message
    };
  }
}

// --- Generate Fallback / Web URL ---
function generateWebIssueUrl({ title, body, labels }) {
  const base = `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new`;
  const params = new URLSearchParams();
  if (title) params.set("title", title);
  if (body) params.set("body", body);
  if (labels) params.set("labels", labels);
  return `${base}?${params.toString()}`;
}

// --- Execution ---
async function main() {
  if (isScan) {
    const scan = scanProject(cwd);
    console.log(JSON.stringify(scan, null, 2));
    return;
  }

  if (isCreate) {
    let body = issueBody;
    if (!body && issueBodyFile) {
      const filePath = path.resolve(cwd, issueBodyFile);
      if (fs.existsSync(filePath)) {
        body = fs.readFileSync(filePath, "utf8");
      }
    }

    if (!issueTitle || !body) {
      console.error(JSON.stringify({
        success: false,
        error: "Missing required --title or --body (or --file)"
      }));
      process.exit(1);
    }

    const result = await createGitHubIssue({
      title: issueTitle,
      body,
      labels: issueLabels
    });

    if (result.success) {
      console.log(JSON.stringify({
        success: true,
        issueNumber: result.issueNumber,
        url: result.htmlUrl,
        title: result.title,
        message: `Issue #${result.issueNumber} created successfully on ${REPO_OWNER}/${REPO_NAME}!`
      }, null, 2));
    } else {
      // Fallback: save to file and generate URL
      const fallbackFile = path.join(cwd, "SEMI_PROPOSAL.md");
      const content = `# ${issueTitle}\n\n${body}`;
      fs.writeFileSync(fallbackFile, content, "utf8");
      const webUrl = generateWebIssueUrl({ title: issueTitle, body, labels: issueLabels });

      console.log(JSON.stringify({
        success: false,
        reason: result.reason,
        errorMessage: result.message,
        savedTo: fallbackFile,
        webUrl,
        message: `Could not publish directly via GitHub API (${result.reason}). Proposal saved to ${fallbackFile}. Open the webUrl to publish.`
      }, null, 2));
    }
    return;
  }

  // Default: Help output
  console.log(`Semi Propose CLI
Usage:
  node propose.mjs --scan [--cwd <path>]
  node propose.mjs --create --title "<title>" --body "<body>" [--labels "l1,l2"]
  node propose.mjs --create --title "<title>" --file "<path-to-body-file>"
`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
