import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/BottomNav'
import { OfflineBanner } from '@/components/layout/OfflineBanner'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-charcoal-950 flex flex-col">
      <OfflineBanner />
      <main id="main-content" className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
