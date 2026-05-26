import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@repo/ui',
    '@repo/shared',
    '@repo/auth',
    '@repo/db',
    '@repo/payments',
    '@repo/cloud-infra',
    '@repo/comfyui-client',
    '@repo/gcs-storage',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        // Google profile pictures (OAuth)
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}

export default nextConfig
