/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  images: {
    // 允许本地 public/uploads 下的文件直接加载，不走优化器
    unoptimized: true
  }
};

module.exports = nextConfig;

