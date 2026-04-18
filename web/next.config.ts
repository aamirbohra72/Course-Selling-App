import type { NextConfig } from "next";
import * as path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), ".."),
};

export default nextConfig;
