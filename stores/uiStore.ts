import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UIState {
  theme: Theme
  toasts: Toast[]
  installPromptEvent: Event | null
  installPromptDismissCount: number
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  setInstallPromptEvent: (event: Event | null) => void
  incrementInstallPromptDismiss: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toasts: [],
      installPromptEvent: null,
      installPromptDismissCount: 0,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      addToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            { ...toast, id: crypto.randomUUID() },
          ],
        })),
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
      setInstallPromptEvent: (event) => set({ installPromptEvent: event }),
      incrementInstallPromptDismiss: () =>
        set((state) => ({
          installPromptDismissCount: state.installPromptDismissCount + 1,
        })),
    }),
    {
      name: 'nextbite-ui',
      partialize: (state) => ({
        theme: state.theme,
        installPromptDismissCount: state.installPromptDismissCount,
      }),
    }
  )
)
