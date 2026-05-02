'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/client'
import { ThemeProvider } from './ThemeProvider'
import { AuthProvider } from './AuthProvider'
import { OfflineProvider } from './OfflineProvider'
import { ToastProvider } from './ToastProvider'
import { InstallPromptCapture } from '@/components/ui/InstallPrompt'
import { PostHogProvider } from './PostHogProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <OfflineProvider>
            <PostHogProvider>
              <InstallPromptCapture />
              <ToastProvider />
              {children}
            </PostHogProvider>
          </OfflineProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
