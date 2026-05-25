'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Badge } from '@repo/ui/components/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@repo/ui/components/collapsible'
import { useToast } from '@repo/ui/hooks/use-toast'
import { formatBytes, formatDate, formatDuration } from '@repo/shared/utils'
import { ChevronDown, Download, Trash2, Image, Film } from 'lucide-react'
import type { GeneratedAsset } from '@repo/shared/types'

export default function LibraryPage() {
  const [typeFilter, setTypeFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('all')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: assets, isLoading } = useQuery<GeneratedAsset[]>({
    queryKey: ['assets', typeFilter, providerFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (providerFilter !== 'all') params.set('provider', providerFilter)
      return fetch(`/api/library?${params}`).then((r) => r.json())
    },
  })

  const { mutate: deleteAsset } = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/library/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['assets'] })
      toast({ title: 'Asset deletado' })
    },
  })

  const handleDownload = async (assetId: string, filename: string) => {
    const res = await fetch(`/api/library/${assetId}/download`)
    const { url } = (await res.json()) as { url: string }
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Biblioteca</h1>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="image">Imagens</SelectItem>
              <SelectItem value="video">Vídeos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="gcp">GCP</SelectItem>
              <SelectItem value="runpod">RunPod</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : !assets?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Image className="h-12 w-12 mb-3 opacity-30" />
            <p>Nenhum asset encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onDelete={() => deleteAsset(asset.id)}
              onDownload={() => handleDownload(asset.id, asset.filename)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AssetCard({
  asset,
  onDelete,
  onDownload,
}: {
  asset: GeneratedAsset
  onDelete: () => void
  onDownload: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted relative">
        {asset.type === 'image' && asset.downloadUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.downloadUrl}
            alt={asset.filename}
            className="w-full h-full object-cover"
          />
        ) : asset.type === 'video' ? (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="h-10 w-10 text-muted-foreground" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge variant={asset.type === 'video' ? 'default' : 'secondary'} className="text-xs">
            {asset.type === 'video' ? '🎬' : '🖼'} {asset.type}
          </Badge>
          {asset.metadata?.provider && (
            <Badge variant="outline" className="text-xs">
              {asset.metadata.provider}
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium truncate flex-1">{asset.filename}</p>
          <div className="flex gap-1 ml-2">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDownload}>
              <Download className="h-3 w-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deletar asset?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O arquivo será removido permanentemente do GCS.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatBytes(asset.sizeBytes)}</span>
          <span>{formatDate(new Date(asset.createdAt))}</span>
        </div>

        {asset.metadata && (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full h-6 text-xs">
                Metadados
                <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${open ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p className="text-foreground font-medium line-clamp-2">{asset.metadata.prompt}</p>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  <MetaItem label="Modelo" value={asset.metadata.model} />
                  <MetaItem label="Steps" value={String(asset.metadata.steps)} />
                  <MetaItem label="CFG" value={String(asset.metadata.cfg)} />
                  <MetaItem label="Seed" value={String(asset.metadata.seed)} />
                  <MetaItem label="Resolução" value={asset.metadata.resolution} />
                  <MetaItem label="Tempo" value={formatDuration(asset.metadata.durationMs)} />
                  <MetaItem label="GPU" value={asset.metadata.gpu} />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
