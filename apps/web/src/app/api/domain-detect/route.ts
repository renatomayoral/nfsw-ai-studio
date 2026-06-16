import { NextRequest, NextResponse } from 'next/server'

const NS_PROVIDERS: { match: string; name: string }[] = [
  { match: 'cloudflare', name: 'Cloudflare' },
  { match: 'godaddy', name: 'GoDaddy' },
  { match: 'domaincontrol', name: 'GoDaddy' },
  { match: 'namecheap', name: 'Namecheap' },
  { match: 'registrar-servers', name: 'Namecheap' },
  { match: 'registro.br', name: 'Registro.br' },
  { match: 'dns.br', name: 'Registro.br' },
  { match: 'hostgator', name: 'HostGator' },
  { match: 'locaweb', name: 'Locaweb' },
  { match: 'kinghost', name: 'KingHost' },
  { match: 'uol', name: 'UOL Host' },
  { match: 'squarespace', name: 'Squarespace' },
  { match: 'wix', name: 'Wix' },
]

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')?.toLowerCase().replace(/^www\./, '')
  if (!domain || !/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domain)) {
    return NextResponse.json({ provider: null })
  }

  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=NS`,
      { headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(3000) },
    )
    const data = await res.json() as { Answer?: { data: string }[] }
    const ns = (data.Answer ?? []).map((r) => r.data.toLowerCase()).join(' ')

    const matched = NS_PROVIDERS.find((p) => ns.includes(p.match))
    return NextResponse.json({ provider: matched?.name ?? null, ns })
  } catch {
    return NextResponse.json({ provider: null })
  }
}
