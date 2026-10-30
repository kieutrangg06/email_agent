/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://127.0.0.1:4000/api/v1/:path*',
      },
      {
        source: '/webhook/:path*',
        destination: 'http://127.0.0.1:5678/webhook/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
