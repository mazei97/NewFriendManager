import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'export',
  basePath: isProd ? '/NewFriendManager' : '',
  images: {
    unoptimized: true,
  },
  turbopack: {},
};

export default nextConfig;
