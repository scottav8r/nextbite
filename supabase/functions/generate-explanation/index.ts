/**
 * NextBite — generate-explanation Edge Function
 *
 * Generates a natural language "Why this fits you" explanation for a suggestion.
 * Primary: OpenAI API
 * Fallback: Rule-based templates (Req 7.13, 7.14, 19.5)
 */

import { corsHeaders } from '../_shared/cors.ts'

// ─── Rule-based templates (fallback) ─────────────────────────────

interface ExplanationContext {
  restaurant_name: string
  top_cuisine: string | null
  top_tier: string | null
  top_occasion: string | null
  price_descriptor: string
  match_score: number
  is_wish: boolean
  dominant_factor: 'cuisine' | 'tier' | 'occasion' | 'price' | 'wish' | 'rating'
}

const TEMPLATES: Record<string, string[]> = {
  cuisine: [
    "Your love for {top_cuisine} makes {restaurant_name} a natural next chapter.",
    "Given your history with {top_cuisine} dining, {restaurant_name} fits your palate perfectly.",
    "{restaurant_name} speaks directly to your appreciation for {top_cuisine} cuisine.",
  ],
  tier: [
    "You've consistently loved {top_tier} spots — {restaurant_name} has that same spirit.",
    "{restaurant_name} carries the hallmarks of a {top_tier} experience you'd appreciate.",
    "Your taste for {top_tier} places makes {restaurant_name} a compelling choice.",
  ],
  occasion: [
    "For a {top_occasion}, {restaurant_name} sets exactly the right tone.",
    "{restaurant_name} is well-suited to the kind of {top_occasion} you enjoy.",
    "Your {top_occasion} memories suggest {restaurant_name} would feel just right.",
  ],
  price: [
    "{restaurant_name} sits comfortably in your preferred {price_descriptor} range.",
    "At {price_descriptor}, {restaurant_name} aligns with your dining style.",
    "The {price_descriptor} experience at {restaurant_name} matches your preferences.",
  ],
  wish: [
    "You've been wanting to try {restaurant_name} — now might be the perfect moment.",
    "{restaurant_name} has been on your list. Your taste profile suggests it won't disappoint.",
    "You added {restaurant_name} to your Wishes for a reason — this could be the night.",
  ],
  rating: [
    "Based on your past ratings, {restaurant_name} aligns closely with what you love.",
    "Your dining history points to {restaurant_name} as a strong match.",
    "{restaurant_name} shares the qualities you've rated most highly.",
  ],
}

function priceLevelDescriptor(level: number | null): string {
  switch (level) {
    case 1: return 'budget-friendly'
    case 2: return 'mid-range'
    case 3: return 'upscale'
    case 4: return 'fine dining'
    default: return 'well-priced'
  }
}

function buildRuleBasedExplanation(ctx: ExplanationContext): string {
  const templates = TEMPLATES[ctx.dominant_factor] ?? TEMPLATES.rating
  const template = templates[Math.floor(Math.random() * templates.length)]

  return template
    .replace('{restaurant_name}', ctx.restaurant_name)
    .replace('{top_cuisine}', ctx.top_cuisine ?? 'great food')
    .replace('{top_tier}', ctx.top_tier ?? 'memorable')
    .replace('{top_occasion}', ctx.top_occasion ?? 'special evening')
    .replace('{price_descriptor}', ctx.price_descriptor)
}

function determineDominantFactor(
  scoreBreakdown: Record<string, number>,
  isWish: boolean
): ExplanationContext['dominant_factor'] {
  if (isWish && scoreBreakdown.wish_bonus > 50) return 'wish'
  const factors: [string, number][] = [
    ['cuisine', scoreBreakdown.taste_match ?? 0],
    ['tier', scoreBreakdown.filter_match ?? 0],
    ['rating', scoreBreakdown.rating_bonus ?? 0],
    ['price', scoreBreakdown.distance_score ?? 0],
  ]
  factors.sort((a, b) => b[1] - a[1])
  return (factors[0][0] as ExplanationContext['dominant_factor']) ?? 'rating'
}

// ─── OpenAI generation ────────────────────────────────────────────

async function generateWithGrok(
  ctx: ExplanationContext,
  apiKey: string
): Promise<string> {
  const prompt = `You are a warm, sophisticated dining companion for NextBite, a personal dining memory app.

Write a single sentence (max 25 words) explaining why "${ctx.restaurant_name}" is a great suggestion for this user.

Context:
- Their favorite cuisine: ${ctx.top_cuisine ?? 'varied'}
- Their preferred dining tier: ${ctx.top_tier ?? 'varied'}
- Common occasion: ${ctx.top_occasion ?? 'varied'}
- Price preference: ${ctx.price_descriptor}
- Match score: ${ctx.match_score}/100
- On their Wishes list: ${ctx.is_wish ? 'Yes' : 'No'}

Rules:
- Be warm, personal, and specific — never generic
- Reference their actual preferences
- Sound like a trusted sommelier's quiet recommendation
- Do NOT start with "I" or "This restaurant"
- One sentence only`

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60,
      temperature: 0.7,
    }),
  })

  if (!res.ok) throw new Error(`Grok error: ${res.status}`)

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

// ─── Handler ──────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      restaurant_name,
      price_level,
      match_score,
      score_breakdown,
      taste_profile,
      is_wish,
      use_openai = true,
    } = body

    const ctx: ExplanationContext = {
      restaurant_name,
      top_cuisine: taste_profile?.top_cuisines?.[0] ?? null,
      top_tier: taste_profile?.top_tiers?.[0] ?? null,
      top_occasion: taste_profile?.top_occasions?.[0] ?? null,
      price_descriptor: priceLevelDescriptor(price_level),
      match_score,
      is_wish,
      dominant_factor: determineDominantFactor(score_breakdown ?? {}, is_wish),
    }

    let explanation = ''
    let source: 'openai' | 'rule_based' = 'rule_based'

    if (use_openai) {
      const apiKey = Deno.env.get('GROK_API_KEY')
      if (apiKey) {
        try {
          explanation = await generateWithGrok(ctx, apiKey)
          source = 'openai'
        } catch {
          // Fall through to rule-based
        }
      }
    }

    if (!explanation) {
      explanation = buildRuleBasedExplanation(ctx)
      source = 'rule_based'
    }

    return new Response(
      JSON.stringify({ explanation, source }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
