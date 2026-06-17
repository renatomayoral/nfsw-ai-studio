import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CreatorsLink — Páginas de links + analytics para criadoras',
  description:
    'Crie páginas de links lindas para cada criadora e acompanhe, por plataforma, exatamente de onde vêm os cliques — OnlyFans, Privacy, Instagram e mais, num painel só.',
  robots: { index: true, follow: true },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
