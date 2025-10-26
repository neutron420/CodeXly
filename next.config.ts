import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* existing config options if any */
  images: {
    remotePatterns: [
      {
        protocol: 'https', // Or 'http' if needed, but https is preferred
        hostname: 'tailark.com',
        port: '', // Usually empty unless a specific port is needed
        pathname: '/_next/image/**', // Be specific if possible, or use '/**' to allow all paths
      },
      // Add other allowed domains here if needed
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc', // Add pravatar for testimonials
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;