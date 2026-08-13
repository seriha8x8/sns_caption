import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // fluent-ffmpeg/ffmpeg-static resolve the ffmpeg binary's path via
  // __dirname at runtime. If Next.js bundles them into the route's compiled
  // output, that path resolution bakes in the build machine's absolute path
  // instead of the deployed function's, so keep them as native `require()`
  // dependencies loaded straight from node_modules at runtime.
  serverExternalPackages: ["ffmpeg-static", "fluent-ffmpeg"],
  // Bundling is skipped for the packages above, but Next.js's file tracer
  // still needs to be told to copy the actual binary into the deployed
  // function, or it fails with "spawn .../ffmpeg-static/ffmpeg ENOENT".
  outputFileTracingIncludes: {
    "/api/generate": ["./node_modules/ffmpeg-static/**/*"],
  },
};

export default nextConfig;
