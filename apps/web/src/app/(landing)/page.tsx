import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MousePointerClick, Users, Link2, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'CreatorsLink — Páginas de links para criadoras de conteúdo',
  description: 'Crie páginas de links personalizadas, rastreie cliques e gerencie múltiplas criadoras em um só lugar.',
}

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-16 px-4 py-24 text-center">
      <section className="max-w-2xl space-y-6">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Páginas de links para{' '}
          <span className="text-primary">criadoras de conteúdo</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Crie páginas de links profissionais, monitore cliques em tempo real e gerencie todas as suas criadoras em um único painel.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Começar agora <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid max-w-3xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, title: 'Multi-criadoras', desc: 'Gerencie várias criadoras em um só painel' },
          { icon: Link2, title: 'Página de links', desc: 'Página personalizada para cada criadora' },
          { icon: MousePointerClick, title: 'Rastreio de cliques', desc: 'Veja exatamente de onde vêm os cliques' },
          { icon: TrendingUp, title: 'Analytics', desc: 'Gráficos e tendências em tempo real' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border bg-card p-5 text-left">
            <Icon className="mb-3 h-6 w-6 text-primary" />
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
