'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { authClient } from '@repo/auth/client'

export default function SettingsPage() {
  const { data: session } = authClient.useSession()
  const user = session?.user

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Configurações</h1>

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
                className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                {(user?.name ?? user?.email ?? 'U')[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold">{user?.name ?? '—'}</p>
              <p className="text-sm text-muted-foreground">{user?.email ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
