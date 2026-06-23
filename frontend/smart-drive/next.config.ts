import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empacota um servidor mínimo (server.js + node_modules essenciais) em
  // .next/standalone — imagem Docker enxuta para Cloud Run.
  output: "standalone",
};

export default nextConfig;
