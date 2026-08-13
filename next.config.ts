import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ffmpeg-static resolves its binary path dynamically at runtime, so
  // Next.js's static file tracer can't detect it needs to be bundled with
  // the /api/generate serverless function. Include it explicitly, or the
  // deployed function fails with "spawn .../ffmpeg-static/ffmpeg ENOENT".
  outputFileTracingIncludes: {
    "/api/generate": ["./node_modules/ffmpeg-static/**/*"],
  },
};

export default nextConfig;
