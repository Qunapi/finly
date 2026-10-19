import type { NextConfig } from "next";

// shortcut: pin patched PostCSS while Next 15 depends on 8.4.31; remove after upgrading Next.
const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const config: NextConfig = {
  output: "export",
  trailingSlash: false,
  ...(repository ? { basePath: `/${repository}`, assetPrefix: `/${repository}/` } : {}),
};

export default config;
