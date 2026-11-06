import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages 静态站点导出
  output: "export",
  // 仓库部署在 https://laihaibo.github.io/city-glow/ 子路径下
  basePath: "/city-glow",
  // GitHub Pages 需要 /map/ → map/index.html 形式的目录路由
  trailingSlash: true,
  // 静态导出不支持 next/image 优化服务
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
