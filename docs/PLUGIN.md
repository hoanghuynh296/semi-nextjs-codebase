# The `semi-design` plugin: pinned to the release tag

Apps install the plugin from the marketplace in this repo (`/plugin marketplace add hoanghuynh296/semi-nextjs-codebase`).
Claude Code reads `.claude-plugin/marketplace.json` from `main`, but the plugin's files come from the **release tag**,
not from `main`:

```json
"source": {
  "source": "git-subdir",
  "url": "https://github.com/hoanghuynh296/semi-nextjs-codebase.git",
  "path": "plugin",
  "ref": "v0.36.1"
}
```

So rules, skills and scripts that are merged into `main` but not released never reach apps that still use the last
release of `@semi/ui`. (Before #160 the source was `"./plugin"`, which installed whatever was on `main`.)

**Installed before the pin?** A plugin installed from `main` while the source was `"./plugin"` is also labelled
0.36.1, and `/plugin marketplace update` / `claude plugin update` compare versions, so they keep that copy. Reinstall
once to get the tag: `claude plugin uninstall semi-design@semi-marketplace`, then
`claude plugin install semi-design@semi-marketplace` (or the same in `/plugin`), then restart the session.

## What follows the pin

- **The plugin's files** (`plugin/`: rules, skills, hooks, the MCP launcher) come from the tag in `ref`.
- **The `@semi/ui` the plugin installs** (`/semi-new-app`, `/semi-check`, `/semi-sync`, `/semi-brand`) is the newest
  release tag **no newer than the plugin's own version** (`plugin/.claude-plugin/plugin.json`, `resolveTargetSpec` in
  `plugin/skills/semi-new-app/scripts/setup.mjs`). A user with an older plugin is told to run
  `/plugin marketplace update semi-marketplace` and is never moved to a release whose rules they do not have; an app
  already on a newer `@semi/ui` is never downgraded.
- **The docs the MCP server answers with** come from the app's installed `@semi/ui` (`plugin/mcp/launch.mjs`), so
  they already match the app.

## Releasing

`npm run bump -- X.Y.Z` writes the version to every manifest **and** moves `ref` to `vX.Y.Z`. `npm run check`
(`check:version`) fails when `ref` is not `v<package.json version>` or the source is not pinned to a tag. Merge the
release commit and push the tag `vX.Y.Z` right away: between the merge and the tag, installs of the plugin fail
because the ref does not exist yet.

## Testing the plugin from `main` or a branch (maintainers)

The pin only applies to the published marketplace. To try unreleased plugin changes:

- One session, no install, from a checkout: `claude --plugin-dir ./plugin` (point it at `plugin/`, not the repo root;
  `/reload-plugins` after edits).
- The full install path from a checkout: copy the repo, set `"source": "./plugin"` in the copy's
  `.claude-plugin/marketplace.json`, then `claude plugin marketplace add <copy>` and
  `claude plugin install semi-design@semi-marketplace`. Never commit `"./plugin"` (`check:version` fails on it).
- `@semi/ui` from a checkout instead of a tag: `SEMI_UI_SOURCE=file:/path/to/semi-nextjs-codebase` for the skills'
  scripts. A plugin from `main` still caps the release tag it installs at its own version until the bump.
- Validate the marketplace and the plugin: `claude plugin validate .` and `claude plugin validate ./plugin`.
