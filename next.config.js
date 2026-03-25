/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['src'],
  },
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
