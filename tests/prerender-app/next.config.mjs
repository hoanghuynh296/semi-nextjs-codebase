// Regression app for #82 (npm run build:prerender-test): a server-rendered app, as the products are (the docs site is a
// static export and cannot show this). Cache Components prerenders each route's shell, so a router hook that runs
// outside <Suspense> in the root layout fails `next build` with CLIENT_HOOK_DYNAMIC.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: { root },
};

export default nextConfig;
