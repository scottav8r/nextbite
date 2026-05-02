import { Suspense } from 'react'
import { MemoryForm } from '@/components/memory/MemoryForm'

export default function NewMemoryPage() {
  return (
    <div>
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-serif text-2xl text-charcoal-900 dark:text-cream-50">New Memory</h1>
        <p className="text-sm text-charcoal-800/50 dark:text-cream-100/40 mt-1">
          Capture a dining experience
        </p>
      </div>
      <Suspense>
        <MemoryForm />
      </Suspense>
    </div>
  )
}
