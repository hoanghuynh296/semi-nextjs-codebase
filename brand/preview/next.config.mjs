// Brand preview site (copied into a brand kit's .preview/ by semi-brand; do not edit there).
// SEMI_BRAND_BASE_PATH: the GitHub Pages path ("/<repo>") when built by the kit's Pages workflow.
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const basePath = process.env.SEMI_BRAND_BASE_PATH || "";

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  transpilePackages: ["@semi/ui"],
  // .preview/ has no package.json of its own: modules come from the kit's node_modules one level up.
  turbopack: { root: resolve(dirname(fileURLToPath(import.meta.url)), "..") },
};

export default nextConfig;
