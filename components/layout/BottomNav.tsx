'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ─── Icons ────────────────────────────────────────────────────────

function HomeIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.69Z" />
      <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
    </svg>
  ) : (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function SparklesIcon({ filled }: { filled?: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  )
}

function HeartIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
    </svg>
  ) : (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  )
}

function BookIcon({ filled }: { filled?: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  )
}

function MapIcon({ filled }: { filled?: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
    </svg>
  )
}

function UserIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
      <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
    </svg>
  )
}

// ─── Wish count ───────────────────────────────────────────────────

function useWishCount() {
  return useQuery({
    queryKey: ['wishes', 'count'],
    queryFn: async () => {
      const supabase = createClient()
      const { count } = await supabase.from('wishes').select('*', { count: 'exact', head: true })
      return count ?? 0
    },
    staleTime: 30 * 1000,
  })
}

// ─── Nav item type ────────────────────────────────────────────────

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ filled?: boolean }>
  badge?: number
  primary?: boolean
}

// ─── Component ───────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname()
  const { data: wishCount = 0 } = useWishCount()

  const navItems: NavItem[] = [
    { href: '/',          label: 'Home',      icon: HomeIcon },
    { href: '/discover',  label: 'Discover',  icon: SparklesIcon },
    { href: '/memories/new', label: 'Log',    icon: PlusIcon as NavItem['icon'], primary: true },
    { href: '/wishes',    label: 'Wishes',    icon: HeartIcon, badge: wishCount },
    { href: '/memories',  label: 'Memories',  icon: BookIcon },
    { href: '/map',       label: 'Map',       icon: MapIcon },
    { href: '/profile',   label: 'Profile',   icon: UserIcon },
  ]

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 inset-x-0 z-40 safe-area-pb"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(232,217,192,0.6)',
      }}
    >
      <style>{`.dark nav[aria-label="Main navigation"] { background: rgba(26,21,16,0.94) !important; border-top-color: rgba(42,37,32,0.8) !important; }`}</style>
      <ul className="flex items-center justify-around h-16 px-1" role="list">
        {navItems.map(({ href, icon: Icon, label, primary, badge }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

          if (primary) {
            return (
              <li key={href}>
                <Link href={href} aria-label={label} aria-current={isActive ? 'page' : undefined}>
                  <motion.span
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center justify-center w-12 h-12 rounded-full shadow-gold"
                    style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #a8893e 100%)' }}
                  >
                    <Icon />
                  </motion.span>
                </Link>
              </li>
            )
          }

          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={badge ? `${label} (${badge})` : label}
                aria-current={isActive ? 'page' : undefined}
                className="relative flex flex-col items-center justify-center gap-0.5 px-1.5 py-1 active:scale-95 transition-transform"
              >
                <motion.span
                  animate={{ color: isActive ? '#c9a96e' : undefined }}
                  className={`transition-colors ${isActive ? 'text-gold-400' : 'text-charcoal-800/35 dark:text-cream-100/35'}`}
                >
                  <Icon filled={isActive} />
                </motion.span>
                <span className={`text-[9px] font-medium transition-colors ${isActive ? 'text-gold-400' : 'text-charcoal-800/35 dark:text-cream-100/35'}`}>
                  {label}
                </span>
                {badge != null && badge > 0 && (
                  <span aria-hidden="true" className="absolute -top-0.5 right-0 min-w-[15px] h-[15px] px-1 rounded-full bg-burgundy-600 text-cream-50 text-[8px] font-bold flex items-center justify-center">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-gold-400"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
