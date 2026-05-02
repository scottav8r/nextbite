import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Minimum 100 runs per property-based test (fast-check default is 100)
    // This is enforced in each test file via { numRuns: 100 }
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'components/**/*.tsx'],
      exclude: ['lib/supabase/types.ts'],
    },
    // Timeout for property-based tests (they can be slow with 100 runs)
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
