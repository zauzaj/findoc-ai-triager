/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict TypeScript and linting during build
  typescript: {
    ignoreBuildErrors: false,
  },
  // Ensure NEXT_PUBLIC_API_BASE_URL is set at build time for client components
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
  },
}

export default nextConfig
