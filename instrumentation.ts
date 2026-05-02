/**
 * Next.js 15 instrumentation hook.
 * Initializes Sentry for both Node.js (server) and Edge runtimes.
 * Ref: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { init } = await import('@sentry/nextjs')
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Strip PII from error payloads
      beforeSend(event) {
        if (event.user) {
          delete event.user.email
          delete event.user.username
          delete event.user.ip_address
        }
        return event
      },
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const { init } = await import('@sentry/nextjs')
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      beforeSend(event) {
        if (event.user) {
          delete event.user.email
          delete event.user.username
          delete event.user.ip_address
        }
        return event
      },
    })
  }
}
