import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite que o Next.js aceite requisições da sua rede local
  allowedDevOrigins: ["172.21.176.1", "localhost"],
};

export default nextConfig;