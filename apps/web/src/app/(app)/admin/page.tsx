'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/components/button'
import { Users, MousePointerClick, Link2, TrendingUp } from 'lucide-react'

type Creator = { id: string; name: string; clicks30d: number; status: string }

export default function AdminPage() {
  const router = useRouter()

  const { data: creators = [] } = useQuery<Creator[]>({
    queryKey: ['creators'],
    queryFn: () => fetch('/api/creators').then((r) => r.json()),
  })

  const totalClicks = creators.reduce((s, c) => s + c.clicks30d, 0)
  const live = creators.filter((c) => c.status === 'live').length

  const stats = [
    { label: 'Criadoras', value: creators.length, icon: Users },
    { label: 'Ativas', value: live, icon: Link2 },
    { label: 'Cliques 30d', value: totalClicks.toLocaleString('pt-BR'), icon: MousePointerClick },
    { label: 'Crescimento', value: '—', icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Visão geral da plataforma</p>
        </div>
        <Button onClick={() => router.push('/creators')}>Gerenciar criadoras</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border bg-card p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div className="mt-2.5 text-[28px] font-extrabold leading-tight">{value}</div>
          </div>
        ))}
      </div>

      {creators.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border bg-card py-20 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30" />
          <div>
            <p className="font-semibold">Nenhuma criadora ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Crie a primeira página de links para começar a rastrear cliques.</p>
          </div>
          <Button onClick={() => router.push('/creators')}>Criar primeira criadora</Button>
        </div>
      )}
    </div>
  )
}
