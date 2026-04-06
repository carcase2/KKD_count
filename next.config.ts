import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  sw: "sw.js",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

/**
 * 개발: PWA 래퍼 미적용 → webpack 훅 없음 → `next dev`가 Turbopack으로 빠르게 기동.
 * 빌드: PWA 적용 → `npm run build`는 `--webpack` 유지.
 */
export default process.env.NODE_ENV === "production" ? withPWA(nextConfig) : nextConfig;
