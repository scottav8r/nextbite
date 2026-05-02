import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers/Providers'

export const metadata: Metadata = {
  title: 'NextBite',
  description: 'Your personal dining memory and discovery companion',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NextBite',
  },
}

export const viewport: Viewport = {
  themeColor: '#c9a96e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
