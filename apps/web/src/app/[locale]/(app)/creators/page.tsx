import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { and, asc, eq, gte, inArray, sql } from 'drizzle-orm'
import { getTranslations, getLocale } from 'next-intl/server'
import { Users } from 'lucide-react'
import { auth } from '@repo/auth'
import { db, schema } from '@repo/db'
import { platformMeta, type CreatorListRow } from '@/lib/creators'
import { CreatorsStats } from './_components/creators-stats'
import { CreatorRow } from './_components/creator-row'
import { CreateCreatorDialog } from './_components/create-creator-dialog'

const { creator, creatorLink, linkClick } = schema

async function getCreators(userId: string): Promise<CreatorListRow[]> {
  const creators = await db.query.creator.findMany({
    where: eq(creator.userId, userId),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  })
  if (!creators.length) return []

  const creatorIds = creators.map((c) => c.id)

  const [curr30, prev30, byPlatform, trendRows] = await Promise.all([
    db
      .select({ creatorId: linkClick.creatorId, n: sql<number>`count(*)::int` })
      .from(linkClick)
      .where(and(inArray(linkClick.creatorId, creatorIds), gte(linkClick.createdAt, sql`now() - interval '30 days'`)))
      .groupBy(linkClick.creatorId),
    db
      .select({ creatorId: linkClick.creatorId, n: sql<number>`count(*)::int` })
      .from(linkClick)
      .where(and(
        inArray(linkClick.creatorId, creatorIds),
        gte(linkClick.createdAt, sql`now() - interval '60 days'`),
        sql`${linkClick.createdAt} < now() - interval '30 days'`,
      ))
      .groupBy(linkClick.creatorId),
    db
      .select({
        creatorId: creatorLink.creatorId,
        platform: creatorLink.platform,
        n: sql<number>`count(${linkClick.id})::int`,
      })
      .from(creatorLink)
      .leftJoin(linkClick, and(
        eq(linkClick.linkId, creatorLink.id),
        gte(linkClick.createdAt, sql`now() - interval '30 days'`),
      ))
      .where(inArray(creatorLink.creatorId, creatorIds))
      .groupBy(creatorLink.creatorId, creatorLink.platform),
    db
      .select({
        creatorId: linkClick.creatorId,
        day: sql<string>`date_trunc('day', ${linkClick.createdAt})`,
        n: sql<number>`count(*)::int`,
      })
      .from(linkClick)
      .where(and(inArray(linkClick.creatorId, creatorIds), gte(linkClick.createdAt, sql`now() - interval '12 days'`)))
      .groupBy(linkClick.creatorId, sql`2`)
      .orderBy(linkClick.creatorId, sql`2`),
  ])

  const curr30Map = new Map(curr30.map((r) => [r.creatorId, r.n]))
  const prev30Map = new Map(prev30.map((r) => [r.creatorId, r.n]))
  const byPlatformMap = new Map<string, typeof byPlatform>()
  for (const r of byPlatform) {
    const arr = byPlatformMap.get(r.creatorId) ?? []
    arr.push(r)
    byPlatformMap.set(r.creatorId, arr)
  }
  const trendMap = new Map<string, typeof trendRows>()
  for (const r of trendRows) {
    const arr = trendMap.get(r.creatorId) ?? []
    arr.push(r)
    trendMap.set(r.creatorId, arr)
  }

  return creators.map((c) => {
    const clicks30d = curr30Map.get(c.id) ?? 0
    const prev30d = prev30Map.get(c.id) ?? 0
    const change =
      prev30d === 0
        ? clicks30d > 0 ? 100 : 0
        : Math.round(((clicks30d - prev30d) / prev30d) * 1000) / 10

    const platforms = byPlatformMap.get(c.id) ?? []
    const top = [...platforms].sort((a, b) => (b.n ?? 0) - (a.n ?? 0))[0]
    const topLink =
      top && (top.n ?? 0) > 0 ? { platform: top.platform, ...platformMeta(top.platform) } : null

    const dayRows = trendMap.get(c.id) ?? []
    const counts = dayRows.map((r) => r.n)
    const maxCount = Math.max(1, ...counts)
    const trend = Array.from({ length: 12 }, (_, i) =>
      Math.round(((counts[i] ?? 0) / maxCount) * 100),
    )

    return {
      id: c.id,
      name: c.name,
      handle: c.handle,
      slug: c.slug,
      avatarUrl: c.avatarUrl,
      customDomain: c.customDomain ?? null,
      status: c.status as 'live' | 'draft',
      clicks30d,
      change,
      topLink: topLink ? { platform: topLink.platform, label: topLink.label, color: topLink.color } : null,
      trend,
    }
  })
}

export default async function CreatorsPage() {
  const h = await headers()
  const session = await auth.api.getSession({ headers: h })
  if (!session) redirect('/br/login')

  const [t, locale, creators] = await Promise.all([
    getTranslations(),
    getLocale(),
    getCreators(session.user.id),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t('creators.title')}</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">{t('creators.description')}</p>
        </div>
        <CreateCreatorDialog />
      </div>

      <CreatorsStats creators={creators} />

      {/* Creators table */}
      <div className="bg-card rounded-2xl border">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <span className="text-[15px] font-bold">{t('creators.tableHeaderTitle')}</span>
          <span className="text-muted-foreground text-xs">{t('creators.tableHeaderSub')}</span>
        </div>

        <div className="text-muted-foreground grid grid-cols-[2.2fr_1.6fr_1fr_1.1fr_1.2fr_0.9fr] gap-3.5 border-b px-5 py-2.5 text-[11px] font-semibold tracking-wider uppercase">
          <div>{t('creators.colCreator')}</div>
          <div>{t('creators.colPage')}</div>
          <div>{t('creators.colClicks30d')}</div>
          <div>{t('creators.colTrend')}</div>
          <div>{t('creators.colTopLink')}</div>
          <div>{t('creators.colStatus')}</div>
        </div>

        {!creators.length ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-16">
            <Users className="h-10 w-10 opacity-30" />
            <p className="text-sm">{t('creators.noCreators')}</p>
          </div>
        ) : (
          creators.map((c) => <CreatorRow key={c.id} c={c} locale={locale} />)
        )}
      </div>
    </div>
  )
}
