import { permanentRedirect } from 'next/navigation'

// Redireciona permanentemente "/" → "/br" (308)
// O middleware (proxy.ts) faz isso via intlMiddleware,
// esta page é o fallback de segurança.
export default function RootPage() {
  permanentRedirect('/br')
}
