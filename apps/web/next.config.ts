import { config } from 'dotenv'
import path from 'path'
import type { NextConfig } from 'next'

config({ path: path.resolve(__dirname, '../../.env') })

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@repo/ui', '@repo/shared', '@repo/auth', '@repo/db', '@repo/payments'],
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
