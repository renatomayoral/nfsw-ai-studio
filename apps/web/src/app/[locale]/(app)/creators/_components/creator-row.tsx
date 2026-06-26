'use client'

import Link from 'next/link'
import { Copy } from 'lucide-react'
import { useToast } from '@repo/ui/hooks/use-toast'
import { useTranslations } from 'next-intl'
import { type CreatorListRow } from '@/lib/creators'
import { Avatar } from './avatar'
import { PlatformLogo } from '@/components/platform-logos'

type Props = { c: CreatorListRow; locale: string }

export function CreatorRow({ c, locale }: Props) {
  const t = useTranslations()
  const { toast } = useToast()

  const nf = (n: number) => n.toLocaleString(locale)

  const formattedChange =
    locale === 'br' || locale === 'es'
      ? String(c.change).replace('.', ',')
      : String(c.change)

  function copy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(`${location.origin}/p/${c.slug}`)
    toast({ title: t('creators.linkCopied') })
  }

  return (
    <Link
      href={`/${locale}/creators/${c.id}`}
      className="hover:bg-primary/5 grid w-full grid-cols-[2.2fr_1.6fr_1fr_1.1fr_1.2fr_0.9fr] items-center gap-3.5 border-b px-5 py-3.5 transition-colors"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={c.name} url={c.avatarUrl} size={40} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{c.name}</div>
          <div className="text-muted-foreground truncate text-[12.5px]">{c.handle}</div>
        </div>
      </div>

      <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-[13px]">
        <span className="truncate font-mono">/p/{c.slug}</span>
        <Copy
          onClick={copy}
          className="text-primary hover:text-primary/70 h-3.5 w-3.5 shrink-0 cursor-pointer"
        />
      </div>

      <div>
        <div className="text-[15px] font-bold">{nf(c.clicks30d)}</div>
        <div
          className="text-xs font-semibold"
          style={{ color: c.change >= 0 ? '#34d399' : '#f87171' }}
        >
          {c.change >= 0 ? '+' : ''}
          {formattedChange}%
        </div>
      </div>

      <div className="flex h-8.5 items-end gap-0.75">
        {c.trend.map((h, i) => (
          <div
            key={i}
            className="bg-primary/55 flex-1 rounded-sm"
            style={{ height: `${Math.max(h, 6)}%` }}
          />
        ))}
      </div>

      <div>
        {c.topLink ? (
          <span className="bg-secondary inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[12.5px] font-semibold">
            <PlatformLogo platform={c.topLink.platform} size={16}  />
            {c.topLink.label}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </div>

      <div>
        {c.status === 'live' ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: 'rgba(52,211,153,.12)', color: '#34d399' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#34d399' }} />
            {t('creators.statusLive')}
          </span>
        ) : (
          <span className="bg-secondary text-muted-foreground inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold">
            {t('creators.statusDraft')}
          </span>
        )}
      </div>
    </Link>
  )
}
