import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AuthForm } from './auth-form'

type Props = { params: Promise<{ locale: string }> }

export const metadata: Metadata = {
  title: 'Entrar — Creators Link',
  description: 'Entre na sua conta Creators Link.',
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('auth')

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#09090b] px-4">
      {/* subtle background glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(236,72,153,0.15), transparent)',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-wordmark-dark.svg" alt="Creators Link" className="mx-auto h-7 w-auto" />
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-7 shadow-2xl backdrop-blur-sm">
          <AuthForm
            googleLabel={t('continueWith')}
            orDivider={t('orDivider')}
            emailLabel={t('emailLabel')}
            emailPlaceholder={t('emailPlaceholder')}
            passwordLabel={t('passwordLabel')}
            passwordPlaceholder={t('passwordPlaceholder')}
            signInButton={t('signInButton')}
            signingIn={t('signingIn')}
            nameLabel={t('nameLabel')}
            namePlaceholder={t('namePlaceholder')}
            confirmPasswordLabel={t('confirmPasswordLabel')}
            confirmPasswordPlaceholder={t('confirmPasswordPlaceholder')}
            registerButton={t('registerButton')}
            registering={t('registering')}
            errorInvalidCredentials={t('errorInvalidCredentials')}
            errorEmailInUse={t('errorEmailInUse')}
            errorGeneric={t('errorGeneric')}
            age18={t('age18')}
            termsLink={t('termsLink')}
            and={t('and')}
            privacyLink={t('privacyLink')}
            validEmailRequired={t('validEmailRequired')}
            validPasswordMin={t('validPasswordMin')}
            validPasswordMax={t('validPasswordMax')}
            validNameMin={t('validNameMin')}
            validNameMax={t('validNameMax')}
            validConfirmRequired={t('validConfirmRequired')}
            errorPasswordMismatch={t('errorPasswordMismatch')}
          />
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-400"
          >
            ← {t('backHome').replace('← ', '')}
          </Link>
        </div>
      </div>
    </div>
  )
}
