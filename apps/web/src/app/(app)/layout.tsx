import { Toaster } from '@repo/ui/components/toaster'
import { Providers } from '../providers'
import { Navigation } from '@/components/navigation'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
          {children}
        </main>
      </div>
      <Toaster />
    </Providers>
  )
}
