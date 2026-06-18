'use client'

import { PlatformConnectCard, type PlatformConnectConfig } from './platform-connect-card'

function PatreonLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#FF424D" />
      <circle cx="19" cy="13" r="7" fill="white" />
      <rect x="6" y="6" width="5" height="20" rx="1" fill="white" />
    </svg>
  )
}

const PATREON_CONFIG: PlatformConnectConfig = {
  platform: 'patreon',
  label: 'Patreon',
  color: '#FF424D',
  logo: <PatreonLogo />,
  connectHref: (creatorId) => `/api/patreon/connect?creatorId=${creatorId}`,
  statusEndpoint: (id) => `/api/patreon/status?creatorId=${id}`,
  disconnectEndpoint: (id) => `/api/patreon/status?creatorId=${id}`,
  docsUrl: 'https://www.patreon.com/portal/registration/register-clients',
  docsLabel: 'Registrar app no Patreon',
}

export function PatreonConnect({ creatorId }: { creatorId: string }) {
  return <PlatformConnectCard creatorId={creatorId} config={PATREON_CONFIG} />
}
