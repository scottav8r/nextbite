# NextBite — Property-Based Test Suite

All 17 correctness properties from the design document, implemented with [fast-check](https://fast-check.io/).

**Minimum iterations per property:** 100  
**Test runner:** Vitest  
**CI:** Runs on every push/PR — all properties must pass before merge

---

## Properties by File

### `auth-validation.test.ts`
- **Property 1** — Client-Side Validation Rejects Invalid Inputs *(Req 1.3)*

### `taste-profile.test.ts`
- **Property 2** — Taste Profile Reflects Logged Memory Attributes *(Req 2.6)*
- **Property 3** — Dining Stats Are Computed Correctly *(Req 2.9, 11.1–11.8)*

### `restaurant.test.ts`
- **Property 4** — Restaurant Import Mapper Preserves All Required Fields *(Req 3.4, 20.4)*
- **Property 15** — Restaurant Deduplication by `place_id` Is Idempotent *(Req 20.2, 20.3)*

### `memory.test.ts`
- **Property 5** — Visit Count Increments Monotonically *(Req 4.12)*
- **Property 6** — Offline Queue Preserves Memory Data *(Req 4.14, 16.7)*

### `tiers.test.ts`
- **Property 7** — Custom Tier Duplicate Detection Is Case-Insensitive *(Req 5.5)*

### `wishes.test.ts`
- **Property 8** — Wishes List Sort Order Preserves Priority Ordering *(Req 6.2)*

### `scoring.test.ts`
- **Property 9** — Match_Score Is Always in [0, 100] *(Req 7.3, 19.2)*
- **Property 10** — Scoring Monotonicity — Wish Bonus and Recency Penalty *(Req 7.4, 7.5, 19.2)*
- **Property 11** — Surprise Me Returns a Top-20% Suggestion *(Req 7.11, 19.6.4)*
- **Property 13** — Sponsored Card Ratio Never Exceeds 1-in-5 *(Req 14.8, 19.6.5)*
- **Property 14** — Diversity Guardrail Limits Same-Cuisine/Tier in Top 5 *(Req 19.6.3)*
- **Property 17** — Personalization Level Is Correctly Assigned by Memory Count *(Req 19.3)*

### `memory-search.test.ts`
- **Property 12** — Memory Search Returns Only Matching Results *(Req 9.2)*

### `data-export.test.ts`
- **Property 16** — Data Export Contains All User Data *(Req 24.1, 24.2)*

---

## Running the Suite

```bash
# Single run (CI mode)
npm test

# Watch mode (development)
npm run test:watch

# With coverage
npx vitest run --coverage
```
