'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { SignUpSchema, type SignUpInput } from '@/lib/validation/schemas'
import { useUIStore } from '@/stores/uiStore'

export default function SignUpPage() {
  const router = useRouter()
  const addToast = useUIStore((s) => s.addToast)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
  })

  async function onSubmit(data: SignUpInput) {
    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { display_name: data.display_name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setIsLoading(false)

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        addToast({ type: 'error', message: 'This email is already in use.' })
      } else {
        addToast({ type: 'error', message: error.message })
      }
      return
    }

    addToast({
      type: 'success',
      message: 'Check your email to confirm your account.',
    })
    router.push('/sign-in')
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
            Start your dining journey
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="display_name"
              className="block text-sm font-medium text-charcoal-900 dark:text-cream-100 mb-1.5"
            >
              Your name
            </label>
            <input
              id="display_name"
              type="text"
              autoComplete="name"
              aria-describedby={errors.display_name ? 'name-error' : undefined}
              aria-invalid={!!errors.display_name}
              {...register('display_name')}
              className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-4 py-3 text-charcoal-900 dark:text-cream-50 placeholder-charcoal-800/40 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
              placeholder="Alex"
            />
            {errors.display_name && (
              <p id="name-error" role="alert" className="mt-1.5 text-xs text-burgundy-600">
                {errors.display_name.message}
              </p>
            )}
          </div>

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
              autoComplete="new-password"
              aria-describedby={errors.password ? 'password-error' : 'password-hint'}
              aria-invalid={!!errors.password}
              {...register('password')}
              className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-4 py-3 text-charcoal-900 dark:text-cream-50 placeholder-charcoal-800/40 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
              placeholder="••••••••"
            />
            {errors.password ? (
              <p id="password-error" role="alert" className="mt-1.5 text-xs text-burgundy-600">
                {errors.password.message}
              </p>
            ) : (
              <p id="password-hint" className="mt-1.5 text-xs text-charcoal-800/50 dark:text-cream-100/40">
                At least 8 characters
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 py-3 font-medium text-sm hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-charcoal-800/60 dark:text-cream-100/50">
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="text-charcoal-900 dark:text-gold-400 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
