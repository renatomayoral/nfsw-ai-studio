'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@repo/ui/lib/utils'
import { Cpu, Image, Library, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Cpu },
  { href: '/generate', label: 'Gerar', icon: Image },
  { href: '/library', label: 'Biblioteca', icon: Library },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-14 items-center gap-6">
          <Link href="/dashboard" className="font-bold text-lg text-primary">
            🎬 AI Studio
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
