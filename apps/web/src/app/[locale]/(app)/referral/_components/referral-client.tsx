'use client'

import { useState } from 'react'
import { Copy, Check, Users, Gift } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'

type ReferredUser = {
  id: string
  name: string
  email: string
  image: string | null
  commissionRate: string
  activeUntil: Date
  createdAt: Date
}

type Props = {
  link: string
  referred: ReferredUser[]
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name} className="h-9 w-9 rounded-full object-cover" referrerPolicy="no-referrer" />
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
      {name[0]?.toUpperCase()}
    </div>
  )
}

export function ReferralClient({ link, referred }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Indique e Ganhe</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Convide pessoas e ganhe comissão sobre as vendas delas
          </p>
        </div>
      </div>

      {/* Referral link card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Seu Link de Divulgação</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ganhe <span className="font-semibold text-foreground">3%</span> de comissão das pessoas que você indicar, durante{' '}
            <span className="font-semibold text-foreground">6 meses</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Link display + copy */}
          <div className="flex items-center gap-2 rounded-xl border bg-muted/40 px-4 py-3">
            <span className="flex-1 truncate font-mono text-[13px] text-muted-foreground">{link}</span>
            <button
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </>
              )}
            </button>
          </div>

          <p className="text-[12.5px] text-muted-foreground">
            Copie o seu link de divulgação e compartilhe com seus amigos e conhecidos
          </p>
        </CardContent>
      </Card>

      {/* Referred users */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Seus Indicados ({referred.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Aqui você pode visualizar todas as pessoas que já se cadastraram através do seu link
          </p>
        </CardHeader>
        <CardContent>
          {referred.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Você ainda não possui indicados</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {referred.map((u) => {
                const active = new Date(u.activeUntil) > new Date()
                return (
                  <div key={u.id} className="flex items-center gap-3 py-3">
                    <Avatar name={u.name} image={u.image} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold">{u.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={[
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground',
                      ].join(' ')}>
                        {active ? `${parseFloat(u.commissionRate) * 100}% ativo` : 'expirado'}
                      </span>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        até {formatDate(u.activeUntil)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
