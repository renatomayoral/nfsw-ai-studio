import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

export function OnlyFansLogo({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="OnlyFans"
      {...props}
    >
      {/* OF wordmark — simplified circular OF icon */}
      <circle cx="12" cy="12" r="12" fill="#00AFF0" />
      <path
        d="M12 5.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z"
        fill="white"
      />
      <path
        d="M10.2 9.8h1.6v4.4h-1.6V9.8zm2.4 0h1.6c.88 0 1.6.72 1.6 1.6v1.2c0 .88-.72 1.6-1.6 1.6h-1.6V9.8zm1.6 1.4h-.2v1.8h.2c.22 0 .4-.18.4-.4v-1c0-.22-.18-.4-.4-.4z"
        fill="white"
      />
    </svg>
  )
}

export function FanslyLogo({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Fansly"
      {...props}
    >
      <rect width="24" height="24" rx="6" fill="#1DA1F2" />
      {/* Fansly "F" stylised */}
      <path
        d="M7 6h7.5v2.2H9.2v2.6h4.8v2.2H9.2V18H7V6z"
        fill="white"
      />
      <circle cx="16.5" cy="7.5" r="1.5" fill="#FF6B9D" />
    </svg>
  )
}

export function FanvueLogo({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Fanvue"
      {...props}
    >
      <rect width="24" height="24" rx="6" fill="#6D5DFC" />
      {/* Stylised "V" for Fanvue */}
      <path
        d="M5 6.5l4.5 11 2.5-6.5 2.5 6.5L19 6.5h-2.3L14.5 13l-2.5-6.5-2.5 6.5L7.3 6.5H5z"
        fill="white"
      />
    </svg>
  )
}

export function InstagramLogo({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Instagram"
      {...props}
    >
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="25%" stopColor="#FCAF45" />
          <stop offset="50%" stopColor="#F77737" />
          <stop offset="75%" stopColor="#F56040" />
          <stop offset="100%" stopColor="#C13584" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
      <rect x="6" y="6" width="12" height="12" rx="3.5" stroke="white" strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.8" fill="none" />
      <circle cx="16" cy="8" r="1" fill="white" />
    </svg>
  )
}

export function TikTokLogo({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="TikTok"
      {...props}
    >
      <rect width="24" height="24" rx="6" fill="#010101" />
      {/* TikTok "d" shape */}
      <path
        d="M16.6 5.3a3.9 3.9 0 0 1-3-2.8h-2.1v11.9c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.2 0 .4 0 .6.06V10.3a6.1 6.1 0 0 0-.6-.03 4.1 4.1 0 1 0 4.1 4.1V9.1a6.08 6.08 0 0 0 3.6 1.17V8.17a3.9 3.9 0 0 1-.6-.87z"
        fill="white"
      />
      <path
        d="M16.6 5.3a3.9 3.9 0 0 1-3-2.8h-2.1v11.9c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.2 0 .4 0 .6.06V10.3"
        fill="#25F4EE"
        opacity="0.6"
      />
    </svg>
  )
}

export function TelegramLogo({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Telegram"
      {...props}
    >
      <circle cx="12" cy="12" r="12" fill="#2AABEE" />
      <path
        d="M5.5 11.7l2.9 1.1 1.1 3.6c.07.23.36.3.54.15l1.6-1.32 3.1 2.3c.28.2.68.07.76-.27l2.2-9.2c.1-.38-.28-.7-.64-.55L5.42 10.9c-.37.15-.36.67.08.8zm3.7 1.9l-.52 2.35-.74-2.48 6.55-4.13-5.3 4.26z"
        fill="white"
      />
    </svg>
  )
}

export function PatreonLogo({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Patreon"
      {...props}
    >
      <rect width="24" height="24" rx="6" fill="#FF424D" />
      {/* Patreon "P" circle shape */}
      <circle cx="14" cy="10" r="4.5" fill="white" />
      <rect x="6" y="5.5" width="2.5" height="13" fill="white" />
    </svg>
  )
}

export function PrivacyLogo({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Privacy"
      {...props}
    >
      <rect width="24" height="24" rx="6" fill="#FF5A5F" />
      {/* Shield shape */}
      <path
        d="M12 3.5L6 6v5c0 3.5 2.6 6.7 6 7.5 3.4-.8 6-4 6-7.5V6l-6-2.5z"
        fill="white"
        opacity="0.9"
      />
      <path
        d="M10 11.5l1.5 1.5 3-3"
        stroke="#FF5A5F"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Lookup by platform key ───────────────────────────────────────────────────

const LOGO_MAP: Record<string, React.ComponentType<IconProps>> = {
  onlyfans: OnlyFansLogo,
  fansly: FanslyLogo,
  fanvue: FanvueLogo,
  instagram: InstagramLogo,
  tiktok: TikTokLogo,
  telegram: TelegramLogo,
  patreon: PatreonLogo,
  privacy: PrivacyLogo,
}

export function PlatformLogo({
  platform,
  size = 24,
  className,
}: {
  platform: string
  size?: number
  className?: string
}) {
  const Logo = LOGO_MAP[platform]
  const radius = size >= 40 ? 12 : size >= 24 ? 8 : 5

  if (!Logo) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center font-bold text-white ${className ?? ''}`}
        style={{ width: size, height: size, fontSize: size * 0.38, background: '#64748b', borderRadius: radius, flexShrink: 0 }}
        aria-label={platform}
      >
        {platform.slice(0, 2).toUpperCase()}
      </span>
    )
  }

  // SVGs don't respect border-radius — wrap in a div with overflow-hidden
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden ${className ?? ''}`}
      style={{ width: size, height: size, borderRadius: radius, flexShrink: 0 }}
      aria-hidden="true"
    >
      <Logo size={size} />
    </span>
  )
}
