import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      [path.resolve(__dirname, "lib/supabase/server")]: path.resolve(
        __dirname,
        "lib/supabase/create-client.ts"
      ),
    }
    return config
  },
  turbopack: {
    resolveAlias: {
      "./lib/supabase/server": "./lib/supabase/create-client.ts",
      "./lib/supabase/server.ts": "./lib/supabase/create-client.ts",
    },
  },
}

export default nextConfig
