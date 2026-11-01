/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  images: { unoptimized: true },
  // /components/button/ → components/button/index.html: nested routes that GitHub Pages serves as is.
  trailingSlash: true,
};

export default nextConfig;
