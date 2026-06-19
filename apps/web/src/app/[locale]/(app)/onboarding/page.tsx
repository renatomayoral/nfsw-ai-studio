import { setRequestLocale } from 'next-intl/server'
import { OnboardingWizard } from './_components/onboarding-wizard'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string }> }

export default async function OnboardingPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return <OnboardingWizard />
}
