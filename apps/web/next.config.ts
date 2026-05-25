import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/ui', '@repo/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
}

export default nextConfig
