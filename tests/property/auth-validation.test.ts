/**
 * Property 1: Client-Side Validation Rejects Invalid Inputs
 *
 * For any string that is not a valid email address format, the client-side
 * email validator SHALL return an error and SHALL NOT submit the form to the
 * Auth_Provider. Similarly, for any password string of length less than 8
 * characters, the password validator SHALL return an error.
 *
 * Validates: Requirements 1.3
 * Tag: Feature: nextbite, Property 1: client-side validation rejects invalid inputs
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { EmailSchema, PasswordSchema, SignInSchema } from '@/lib/validation/schemas'

describe('Property 1: Client-Side Validation Rejects Invalid Inputs', () => {
  it('rejects any string that is not a valid email format', () => {
    fc.assert(
      fc.property(
        // Generate strings that are NOT valid emails (no @ or no domain)
        fc.oneof(
          fc.string({ minLength: 0, maxLength: 50 }).filter((s) => !s.includes('@')),
          fc.string({ minLength: 1, maxLength: 50 }).map((s) => s + '@'),
          fc.constant(''),
          fc.constant('notanemail'),
          fc.constant('@nodomain'),
          fc.constant('missing@'),
          fc.constant('spaces in@email.com'),
        ),
        (invalidEmail) => {
          const result = EmailSchema.safeParse(invalidEmail)
          expect(result.success).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('accepts valid email addresses', () => {
    const validEmails = [
      'user@example.com',
      'test.user+tag@domain.co.uk',
      'a@b.io',
      'hello@nextbite.app',
    ]
    for (const email of validEmails) {
      const result = EmailSchema.safeParse(email)
      expect(result.success, `Expected ${email} to be valid`).toBe(true)
    }
  })

  it('rejects any password shorter than 8 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 7 }),
        (shortPassword) => {
          const result = PasswordSchema.safeParse(shortPassword)
          expect(result.success).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('accepts any password of 8 or more characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 100 }),
        (validPassword) => {
          const result = PasswordSchema.safeParse(validPassword)
          expect(result.success).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('rejects sign-in form when either field is invalid', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.string({ minLength: 0, maxLength: 30 }).filter((s) => !s.includes('@') || s.endsWith('@')),
          password: fc.string({ minLength: 0, maxLength: 7 }),
        }),
        (invalidForm) => {
          const result = SignInSchema.safeParse(invalidForm)
          expect(result.success).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})
