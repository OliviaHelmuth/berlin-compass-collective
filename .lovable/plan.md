## What broke

The match endpoint is real (calls Lovable AI + your Supabase catalog), but every call now throws:

`AI_NoObjectGeneratedError: No object generated: response did not match schema.`

Root cause: `matchmaking.functions.ts` uses the AI SDK's `generateObject({ schema })` against `google/gemini-3-flash-preview`. That preview model's structured-output mode is rejecting/returning a payload that doesn't satisfy our Zod schema, and the "fallback to gemini-2.5-pro" path uses the same strict `generateObject` path so it fails the same way. Result: 100% failure on both the templates and free-text input — exactly what you're seeing.

The UI also swallows the real message behind a generic banner, so it looks like "AI isn't hooked up" when in fact it is — the model just isn't returning valid JSON for that schema.

## Fix plan

1. **`src/lib/matchmaking.functions.ts` — switch to a robust JSON path**
   - Replace `generateObject` with `generateText` + a strict "return JSON only, matching this shape" system prompt, then `JSON.parse` + `ResultSchema.parse` server-side. This avoids the gateway's constrained-decoding state machine that's currently rejecting our schema on the preview model.
   - Keep the same `ResultSchema` (summary + picks[kind,id,title,why]) and the same id-validation filter against the catalog.
   - Use `google/gemini-2.5-flash` as primary (stable, supports our context size) and `google/gemini-2.5-pro` as fallback.
   - Wrap parsing in try/catch; if the model returns prose around the JSON, extract the first `{...}` block before parsing.
   - On hard failure, throw a clean `Error("AI returned an unreadable response. Try rephrasing.")` instead of leaking the SDK stack.
   - Explicitly re-throw `429` / `402` with clear messages so the UI can show the right banner.

2. **`src/routes/match.tsx` — real error handling**
   - Keep the existing 429/402 branches.
   - Add a dev-friendly details line under the banner (collapsed `<details>`) showing the raw message so future failures are diagnosable without digging through network tab.
   - Show an empty-state hint when the AI returns 0 valid picks (ids didn't match catalog) — "Couldn't find clean matches, try adding your stage / focus / what you need next."

3. **No DB changes, no new packages, no changes to routes other than `match.tsx`.**

## Out of scope

- Streaming responses, caching, per-user rate limits, dedicated detail pages — same as before.
- Touching `events.tsx` / `opportunities.tsx` hash-scroll behavior (already working).

Approve and I'll implement.
