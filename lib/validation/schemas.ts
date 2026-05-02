import { z } from 'zod'

// ─── Auth Schemas ─────────────────────────────────────────────────

export const EmailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')

export const SignInSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
})

export const SignUpSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  display_name: z.string().min(1, 'Display name is required').max(50),
})

export type SignInInput = z.infer<typeof SignInSchema>
export type SignUpInput = z.infer<typeof SignUpSchema>

// ─── Memory Schema ────────────────────────────────────────────────

export const DishSchema = z.object({
  name: z.string().min(1),
  notes: z.string().nullable().optional(),
  photo_url: z.string().url().nullable().optional(),
})

export const MemorySchema = z.object({
  restaurant_id: z.string().uuid(),
  visit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  overall_rating: z.number().int().min(1).max(10),
  food_rating: z.number().int().min(1).max(10).nullable().optional(),
  service_rating: z.number().int().min(1).max(10).nullable().optional(),
  ambiance_rating: z.number().int().min(1).max(10).nullable().optional(),
  value_rating: z.number().int().min(1).max(10).nullable().optional(),
  vibe_rating: z.number().int().min(1).max(10).nullable().optional(),
  tiers: z.array(z.string()).default([]),
  cuisine_tags: z.array(z.string()).default([]),
  vibe_tags: z.array(z.string()).default([]),
  occasions: z.array(z.string()).default([]),
  approximate_cost: z.number().int().positive().nullable().optional(),
  narrative_note: z.string().max(2000).nullable().optional(),
  dishes: z.array(DishSchema).max(50).default([]),
  photo_urls: z.array(z.string().url()).max(10).default([]),
  mood: z.string().nullable().optional(),
})

export type MemoryInput = z.infer<typeof MemorySchema>

// ─── Wish Schema ──────────────────────────────────────────────────

export const WishSchema = z.object({
  restaurant_id: z.string().uuid(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  notes: z.string().nullable().optional(),
  target_occasion: z.string().nullable().optional(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
})

export type WishInput = z.infer<typeof WishSchema>

// ─── Tier Schema ──────────────────────────────────────────────────

export const TierSchema = z.object({
  name: z
    .string()
    .min(1, 'Tier name is required')
    .max(50, 'Tier name must be 50 characters or less'),
})

// ─── URL Schema ───────────────────────────────────────────────────

export const ReservationUrlSchema = z
  .string()
  .url('Please enter a valid URL')
  .optional()
  .or(z.literal(''))
