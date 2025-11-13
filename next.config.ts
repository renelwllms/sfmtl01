import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Enable standalone output for Docker
  eslint: {
    // Don't fail the build on ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail the build on TypeScript errors during production builds
    // Remove this if you want strict type checking
    ignoreBuildErrors: false,
  },
  // Allow dev server access from network IP
  allowedDevOrigins: [
    'http://192.168.1.148:3000',
    'http://localhost:3000',
  ],
};

export default nextConfig;
