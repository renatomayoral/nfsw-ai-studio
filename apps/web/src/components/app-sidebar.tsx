'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { LayoutDashboard, Users, Settings, LogOut } from 'lucide-react'
import { authClient } from '@repo/auth/client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@repo/ui/components/sidebar'
import { ThemeToggle } from './theme-toggle'
import { LocaleSwitcher } from './locale-switcher'

export function AppSidebar() {
  const t = useTranslations()
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: `/${locale}/dashboard`, label: t('navigation.dashboard'), icon: LayoutDashboard },
    { href: `/${locale}/creators`, label: t('navigation.creators'), icon: Users },
    { href: `/${locale}/settings`, label: t('navigation.settings'), icon: Settings },
  ]

  const logoSrc =
    mounted && theme === 'light' ? '/logo-wordmark-light.svg' : '/logo-wordmark-dark.svg'

  const user = session?.user

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-3 py-3">
        <Link href={`/${locale}/dashboard`} className="flex items-center">
          <Image src={logoSrc} alt="Creators Link" width={140} height={25} priority />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive =
                  pathname === href ||
                  (href !== `/${locale}/dashboard` && pathname.startsWith(href))
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
                      <Link href={href}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? 'User'}
                className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                {(user?.name ?? user?.email ?? 'U')[0]?.toUpperCase()}
              </div>
            )}
            <span className="truncate text-[13px] font-medium">{user?.name ?? user?.email}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <LocaleSwitcher />
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              title={t('navigation.signOut')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
