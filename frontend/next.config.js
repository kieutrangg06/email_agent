/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/helpdesk',
        destination: '/tickets',
      },
      {
        source: '/knowledge',
        destination: '/approvals',
      },
    ];
  },
};

module.exports = nextConfig;

