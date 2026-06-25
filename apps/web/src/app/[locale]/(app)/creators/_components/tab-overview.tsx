'use client'

import { useLocale, useTranslations } from 'next-intl'
import { type CreatorDetail } from '@/lib/creators'
import { CreatorLinks } from './creator-links'

type Props = { detail: CreatorDetail }

export function TabOverview({ detail }: Props) {
  const t = useTranslations()
  const locale = useLocale()
  const maxD = Math.max(1, ...detail.daily)
  const nf = (n: number) => n.toLocaleString(locale)

  return (
    <div className="divide-y">
      {/* Stats + chart */}
      <div className="grid gap-6 p-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Bar chart */}
        <section aria-label="Cliques nos últimos 14 dias">
          <div className="mb-4 flex items-baseline justify-between">
            <span className="text-[13px] font-semibold text-muted-foreground">
              {t('creators.clicksLast14')}
            </span>
            <span className="text-[22px] font-extrabold tabular-nums">
              {nf(detail.totalClicks30d)}{' '}
              <span className="text-[13px] font-medium text-muted-foreground">{t('creators.total')}</span>
            </span>
          </div>
          <div
            className="flex h-40 items-end gap-1.5 border-b pb-0.5"
            role="img"
            aria-label={`Gráfico de barras: ${detail.totalClicks30d} cliques totais nos últimos 14 dias`}
          >
            {detail.daily.map((v, i) => (
              <div
                key={i}
                className="flex-1 origin-bottom rounded-t-lg"
                aria-hidden="true"
                style={{
                  height: `${Math.max(Math.round((v / maxD) * 100), 4)}%`,
                  background: 'linear-gradient(180deg,#60a5fa,#3b82f6)',
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>{t('creators.daysAgo14')}</span>
            <span>{t('creators.daysAgo7')}</span>
            <span>{t('creators.today')}</span>
          </div>
        </section>

        {/* Per-platform breakdown */}
        <section aria-label="Cliques por plataforma">
          <span className="text-[13px] font-semibold text-muted-foreground">
            {t('creators.clicksByPlatform')}
          </span>
          <div className="mt-4 flex flex-col gap-3.5">
            {detail.links.map((l) => (
              <div key={l.id}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2.5 text-[13.5px] font-semibold">
                    <span
                      className="h-2.5 w-2.5 rounded"
                      style={{ background: l.color }}
                      aria-hidden="true"
                    />
                    {l.label}
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    <strong className="tabular-nums text-foreground">{nf(l.clicks)}</strong>{' '}
                    · {l.pct}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-[width]"
                    style={{ width: `${l.barPct}%`, background: l.color }}
                    role="presentation"
                  />
                </div>
              </div>
            ))}
            {detail.links.length === 0 && (
              <p className="py-6 text-center text-[13px] text-muted-foreground">
                Nenhum link configurado ainda.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Links management */}
      <CreatorLinks creatorId={detail.id} links={detail.links} />
    </div>
  )
}
