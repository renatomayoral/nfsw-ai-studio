'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@repo/ui/components/dialog'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { useToast } from '@repo/ui/hooks/use-toast'
import { Camera, Plus, X } from 'lucide-react'
import { slugify } from '@/lib/creators'

type Platform = { id: string; key: string; label: string; color: string; active: boolean }

export function CreateCreatorDialog() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const qc = useQueryClient()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ['platforms'],
    queryFn: () => fetch('/api/platforms').then((r) => r.json()),
    enabled: open,
    staleTime: 60_000,
  })

  function reset() {
    setNewName('')
    setAvatarUrl(null)
    setAvatarPreview(null)
    setUploadingAvatar(false)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(t('creators.toastUploadError'))
      const { url } = (await res.json()) as { url: string }
      setAvatarUrl(url)
    } catch (err) {
      toast({ title: t('creators.toastUploadError'), description: (err as Error).message, variant: 'destructive' })
      setAvatarPreview(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const { mutate: createCreator, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/creators', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: newName, avatarUrl: avatarUrl ?? undefined }),
      })
      if (!res.ok) throw new Error(t('creators.toastCreateError'))
      return res.json() as Promise<{ id: string; slug: string }>
    },
    onSuccess: ({ id }) => {
      setOpen(false)
      reset()
      void qc.invalidateQueries({ queryKey: ['creators'] })
      toast({ title: t('creators.toastCreateSuccess') })
      router.push(`/${locale}/creators/${id}`)
    },
    onError: (e) =>
      toast({ title: t('creators.toastCreateError'), description: (e as Error).message, variant: 'destructive' }),
  })

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t('creators.newCreatorButton')}
      </Button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('creators.dialogNewTitle')}</DialogTitle>
            <DialogDescription>{t('creators.dialogNewDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center gap-3">
              <label className="group relative cursor-pointer">
                <div className="border-border bg-secondary group-hover:border-primary h-20 w-20 overflow-hidden rounded-full border-2 border-dashed transition-colors">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-1">
                      <Camera className="h-6 w-6" />
                      <span className="text-[10px] font-medium">{t('creators.dialogAvatar')}</span>
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
              </label>
              {avatarPreview && (
                <button
                  onClick={() => { setAvatarPreview(null); setAvatarUrl(null) }}
                  className="text-muted-foreground hover:text-destructive flex items-center gap-1 text-xs"
                >
                  <X className="h-3 w-3" />
                  {t('creators.dialogRemoveAvatar')}
                </button>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">{t('creators.dialogNameLabel')}</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('creators.dialogNamePlaceholder')}
                className="mt-2"
              />
            </div>

            <div className="bg-background text-muted-foreground rounded-lg border px-3 py-2.5 text-sm">
              {t('creators.dialogUrlLabel')}{' '}
              <span className="text-primary font-mono">
                /p/{newName ? slugify(newName) : t('creators.dialogUrlPlaceholder')}
              </span>
            </div>

            {platforms.filter((p) => p.active).length > 0 && (
              <div>
                <p className="text-sm font-medium">{t('creators.dialogPlatformsLabel')}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {platforms.filter((p) => p.active).map((p) => (
                    <span
                      key={p.id}
                      className="bg-secondary inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); reset() }}>
              {t('creators.dialogCancel')}
            </Button>
            <Button
              onClick={() => createCreator()}
              disabled={isPending || uploadingAvatar || newName.trim().length < 2}
            >
              {isPending ? t('creators.dialogCreating') : t('creators.dialogCreate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
