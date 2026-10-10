/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/tickets',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
