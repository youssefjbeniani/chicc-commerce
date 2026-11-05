import type { NextConfig } from "next";

const productImagePath = "/storage/v1/object/public/chicc-product-images/**";

function supabaseImagePatterns() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) return [];

  try {
    const url = new URL(projectUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return [];
    return [{
      protocol: url.protocol.slice(0, -1) as "http" | "https",
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: productImagePath,
    }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  transpilePackages: ["@chicc/types", "@chicc/ui", "@chicc/validation"],
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    remotePatterns: supabaseImagePatterns(),
  },
};

export default nextConfig;
