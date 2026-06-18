'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Settings2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { authClient } from '@repo/auth/client'

export default function SettingsPage() {
  const { data: session } = authClient.useSession()
  const user = session?.user
  const locale = useLocale()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plataformas disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-3 text-sm">
            Gerencie as plataformas disponíveis para todas as criadoras (OnlyFans, Fansly, Instagram, etc.).
          </p>
          <Link
            href={`/${locale}/creators/platforms`}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-accent"
          >
            <Settings2 className="h-4 w-4" />
            Gerenciar plataformas
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sua conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? ''}
                className="ring-primary/20 h-14 w-14 rounded-full object-cover ring-2"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="bg-primary/20 text-primary flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold">
                {(user?.name ?? user?.email ?? 'U')[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold">{user?.name ?? '—'}</p>
              <p className="text-muted-foreground text-sm">{user?.email ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
