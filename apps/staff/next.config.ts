import type { NextConfig } from "next";

const productImagePath = "/storage/v1/object/public/chicc-product-images/**";

const nextConfig: NextConfig = {
  transpilePackages: ["@chicc/types", "@chicc/ui", "@chicc/validation"],
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: productImagePath },
      { protocol: "http", hostname: "127.0.0.1", port: "54321", pathname: productImagePath },
      { protocol: "http", hostname: "localhost", port: "54321", pathname: productImagePath },
    ],
  },
};

export default nextConfig;
