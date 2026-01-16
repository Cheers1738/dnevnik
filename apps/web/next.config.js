/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  transpilePackages: ["@dnevnik/shared"]
};

module.exports = nextConfig;
