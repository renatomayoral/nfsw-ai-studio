'use client'

import { type CreatorDetail } from '@/lib/creators'
import { Monetization } from './monetization'
import { CryptoPanel } from './crypto-panel'

type Props = { detail: CreatorDetail }

export function TabMonetization({ detail }: Props) {
  return (
    <div className="divide-y">
      <Monetization detail={detail} />
      <CryptoPanel detail={detail} />
    </div>
  )
}
