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
    const serverPath = path.resolve(__dirname, "lib/supabase/server")
    const serverTsPath = path.resolve(__dirname, "lib/supabase/server.ts")
    const createClientPath = path.resolve(__dirname, "lib/supabase/create-client.ts")
    config.resolve.alias = {
      ...config.resolve.alias,
      [serverPath]: createClientPath,
      [serverTsPath]: createClientPath,
    }
    return config
  },
  turbopack: {
    resolveAlias: {
      "@/lib/supabase/server": "./lib/supabase/create-client.ts",
      "@/lib/supabase/server.ts": "./lib/supabase/create-client.ts",
      "./lib/supabase/server": "./lib/supabase/create-client.ts",
      "./lib/supabase/server.ts": "./lib/supabase/create-client.ts",
      "lib/supabase/server": "./lib/supabase/create-client.ts",
      "lib/supabase/server.ts": "./lib/supabase/create-client.ts",
    },
  },
}

export default nextConfig
