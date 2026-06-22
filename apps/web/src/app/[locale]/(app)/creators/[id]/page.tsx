'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/components/alert-dialog'
import { type CreatorDetail } from '@/lib/creators'
import { Tracking } from '../_components/tracking'

export default function CreatorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const locale = useLocale()
  const qc = useQueryClient()
  const [deleting, setDeleting] = useState(false)

  const { data: detail, isLoading } = useQuery<CreatorDetail>({
    queryKey: ['creator', id],
    queryFn: () => fetch(`/api/creators/${id}`).then((r) => r.json()),
    initialData: () => qc.getQueryData<CreatorDetail>(['creator', id]),
  })

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/creators/${id}`, { method: 'DELETE' })
      qc.invalidateQueries({ queryKey: ['creators'] })
      router.push(`/${locale}/creators`)
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-border" />
        <div className="h-96 animate-pulse rounded-2xl bg-border" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-muted-foreground">
        <p>Criadora não encontrada.</p>
        <Button variant="outline" onClick={() => router.push(`/${locale}/creators`)}>
          Voltar para lista
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${locale}/creators`)}
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Criadoras
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10 hover:text-red-400">
              <Trash2 className="mr-1.5 h-4 w-4" />
              Deletar criadora
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar {detail.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação é irreversível. Todos os links, cliques e planos VIP dessa criadora serão deletados permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {deleting ? 'Deletando…' : 'Sim, deletar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Tracking detail={detail} />
    </div>
  )
}
