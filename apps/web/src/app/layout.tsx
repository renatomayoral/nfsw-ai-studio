import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@repo/ui/globals.css'
import { Toaster } from '@repo/ui/components/toaster'
import { Providers } from './providers'
import { Navigation } from '@/components/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NFSW AI Studio',
  description: 'Dashboard para geração de vídeo e imagem com IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
              {children}
            </main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
