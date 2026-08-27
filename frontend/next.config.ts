import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5003/uploads/:path*', // Proxy to backend
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:5003/api/:path*', // Proxy to backend
      },
    ];
  },
  allowedDevOrigins: ['172.10.3.106', 'http://172.10.3.106:5013'],
};

export default nextConfig;
