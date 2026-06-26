'use client'

import { PlatformConnectCard, type PlatformConnectConfig } from './platform-connect-card'
import type { ConnectedPlatform } from '@/lib/creators'
import { PlatformLogo } from '@/components/platform-logos'

const PATREON_CONFIG: PlatformConnectConfig = {
  platform: 'patreon',
  label: 'Patreon',
  color: '#FF424D',
  logo: <PlatformLogo platform="patreon" size={28}  />,
  connectHref: (creatorId) => `/api/patreon/connect?creatorId=${creatorId}`,
  statusEndpoint: (id) => `/api/patreon/status?creatorId=${id}`,
  disconnectEndpoint: (id) => `/api/patreon/status?creatorId=${id}`,
  docsUrl: 'https://www.patreon.com/portal/registration/register-clients',
  docsLabel: 'Registrar app no Patreon',
}

export function PatreonConnect({ creatorId, initialConnection }: { creatorId: string; initialConnection?: ConnectedPlatform }) {
  return <PlatformConnectCard creatorId={creatorId} config={PATREON_CONFIG} initialConnection={initialConnection} />
}
