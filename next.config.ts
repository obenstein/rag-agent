import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {

  },
  /* config options here */
  reactStrictMode: true,
};

module.exports = {
  env: {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  },
};
export default nextConfig;
