import { Providers } from '../providers'

/** Full-screen layout for the ComfyUI studio — no nav, no padding */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="h-screen w-screen overflow-hidden">
        {children}
      </div>
    </Providers>
  )
}
