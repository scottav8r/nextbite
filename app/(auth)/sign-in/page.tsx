'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { SignInSchema, type SignInInput } from '@/lib/validation/schemas'
import { useUIStore } from '@/stores/uiStore'

export default function SignInPage() {
  const router = useRouter()
  const addToast = useUIStore((s) => s.addToast)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(SignInSchema),
  })

  async function onSubmit(data: SignInInput) {
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    setIsLoading(false)

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        addToast({ type: 'error', message: 'Invalid email or password.' })
      } else {
        addToast({ type: 'error', message: error.message })
      }
      return
    }

    router.push('/')
    router.refresh()
  }

  async function signInWithOAuth(provider: 'google' | 'apple') {
    setOauthLoading(provider)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      addToast({ type: 'error', message: error.message })
      setOauthLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-charcoal-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-charcoal-900 dark:text-cream-50 mb-2">
            NextBite
          </h1>
          <p className="text-sm text-charcoal-800/60 dark:text-cream-100/60">
            Your personal dining companion
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-charcoal-900 dark:text-cream-100 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
              {...register('email')}
              className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-4 py-3 text-charcoal-900 dark:text-cream-50 placeholder-charcoal-800/40 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p id="email-error" role="alert" className="mt-1.5 text-xs text-burgundy-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-charcoal-900 dark:text-cream-100 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
              {...register('password')}
              className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-4 py-3 text-charcoal-900 dark:text-cream-50 placeholder-charcoal-800/40 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
              placeholder="••••••••"
            />
            {errors.password && (
              <p id="password-error" role="alert" className="mt-1.5 text-xs text-burgundy-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 py-3 font-medium text-sm hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-cream-200 dark:border-charcoal-800" />
          </div>
          <div className="relative flex justify-center text-xs text-charcoal-800/50 dark:text-cream-100/40">
            <span className="bg-cream-50 dark:bg-charcoal-950 px-3">or continue with</span>
          </div>
        </div>

        {/* OAuth buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => signInWithOAuth('google')}
            disabled={!!oauthLoading}
            aria-label="Sign in with Google"
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 py-3 text-sm font-medium text-charcoal-900 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-800 active:scale-[0.98] transition disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            {oauthLoading === 'google' ? 'Redirecting…' : 'Sign in with Google'}
          </button>

          <button
            type="button"
            onClick={() => signInWithOAuth('apple')}
            disabled={!!oauthLoading}
            aria-label="Sign in with Apple"
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 py-3 text-sm font-medium text-charcoal-900 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-800 active:scale-[0.98] transition disabled:opacity-50"
          >
            <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden="true">
              <path d="M13.173 9.497c-.02-2.17 1.772-3.22 1.853-3.272-1.01-1.476-2.578-1.678-3.135-1.7-1.334-.135-2.607.787-3.283.787-.676 0-1.718-.77-2.826-.748-1.45.021-2.793.843-3.537 2.14C.77 9.19 1.87 13.5 3.4 15.84c.757 1.09 1.657 2.31 2.836 2.267 1.14-.046 1.57-.73 2.948-.73 1.378 0 1.77.73 2.97.706 1.228-.02 2.003-1.107 2.752-2.202.87-1.26 1.228-2.48 1.248-2.543-.027-.012-2.39-.916-2.41-3.64l-.571-.001zM10.97 3.17C11.58 2.43 12 1.41 11.87.37c-.87.036-1.92.58-2.54 1.31-.558.65-1.047 1.69-.865 2.69.97.075 1.96-.49 2.505-1.2z"/>
            </svg>
            {oauthLoading === 'apple' ? 'Redirecting…' : 'Sign in with Apple'}
          </button>
        </div>

        {/* Sign up link */}
        <p className="mt-8 text-center text-sm text-charcoal-800/60 dark:text-cream-100/50">
          Don&apos;t have an account?{' '}
          <Link
            href="/sign-up"
            className="text-charcoal-900 dark:text-gold-400 font-medium hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
