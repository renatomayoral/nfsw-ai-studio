'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { type CreatorDetail } from '@/lib/creators'
import { Tracking } from '../_components/tracking'

export default function CreatorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const locale = useLocale()
  const qc = useQueryClient()

  const { data: detail, isLoading } = useQuery<CreatorDetail>({
    queryKey: ['creator', id],
    queryFn: () => fetch(`/api/creators/${id}`).then((r) => r.json()),
    // reuse data already fetched from the list page if available
    initialData: () => qc.getQueryData<CreatorDetail>(['creator', id]),
  })

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
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${locale}/creators`)}
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Criadoras
        </Button>
      </div>

      <Tracking detail={detail} />
    </div>
  )
}
