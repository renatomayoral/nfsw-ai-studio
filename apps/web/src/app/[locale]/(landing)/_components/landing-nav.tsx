import Link from 'next/link'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { getTranslations } from 'next-intl/server'

const ACCENT = '#7C3AED'

export async function LandingNav() {
  const t = await getTranslations()

  const navBg = 'rgba(2,8,23,.72)'
  const navBorder = '#11203a'
  const linkColor = '#94a3b8'
  const signInColor = '#cbd5e1'
  const logoSrc = '/logo-wordmark-dark.svg'

  const navLinks = [
    ['#recursos', t('nav.features')],
    ['#como', t('nav.howItWorks')],
    ['#precos', t('nav.pricing')],
    ['#faq', t('nav.faq')],
  ] as const

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: `1px solid ${navBorder}`,
        background: navBg,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 32,
        }}
      >
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Creators Link" height={28} style={{ height: 28, width: 'auto' }} />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          {navLinks.map(([href, label]) => (
            <a
              key={href}
              href={href}
              style={{
                padding: '8px 13px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: linkColor,
                textDecoration: 'none',
              }}
            >
              {label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LocaleSwitcher />
          <Link
            href="/login"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: signInColor,
              padding: '8px 6px',
              textDecoration: 'none',
            }}
          >
            {t('nav.signIn')}
          </Link>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 16px',
              borderRadius: 9,
              background: ACCENT,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: `0 8px 22px -8px ${ACCENT}`,
            }}
          >
            {t('nav.getStarted')}
          </Link>
        </div>
      </div>
    </nav>
  )
}
