import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['br', 'en', 'es'],
  defaultLocale: 'br',
  localePrefix: 'always',
})
