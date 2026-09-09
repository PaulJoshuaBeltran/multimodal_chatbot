import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['trance-ankle-unsaddle.ngrok-free.dev'],
};
// if no alowedDevOrigins:
// ⚠ Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr from "trance-ankle-unsaddle.ngrok-free.dev".

export default nextConfig;
