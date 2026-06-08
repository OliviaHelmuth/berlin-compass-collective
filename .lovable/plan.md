## Loading state + friendly error handling for AI Match

`src/routes/match.tsx` only. No server or schema changes.

### 1. Loading screen (while `busy` is true)

Render a loading card under the form with:

- Pulsing dot / spinner using existing tokens (border-outline, bg-surface-container, shadow-brutal).
- Headline: "Scanning the Berlin ecosystem…"
- Rotating status lines, cycling every ~1.6s so it visibly progresses:
  1. "Reading 60 places, 20 events, 20 opportunities…"
  2. "Asking the AI concierge…"
  3. "Picking the best 3–5 matches for you…"
  4. "Writing why each one fits…"
- Hint: "This usually takes 5–15 seconds."
- 3 skeleton pick cards (same shape as `PickCard`) pulsing below, so the layout doesn't jump on arrival.

Implementation: `useState` step index + `useEffect` interval started when `busy` flips true, cleared on cleanup. Keep button-disabled + label change.

### 2. Friendly error handling

Map server errors to clear, human messages instead of raw stacks:

| Server error contains | UI shows |
| --- | --- |
| `429` | "Too many requests right now — give it a few seconds and try again." |
| `402` | "The AI credits for this workspace are used up. Add more in Settings → Workspace → Usage." |
| `AI is not configured` | "AI isn't connected yet. Please contact the site admin." |
| `unreadable response` / parse / schema | "The AI got confused by that one. Try rephrasing with your stage, focus area, or what you need next." |
| network / fetch / `Failed to fetch` | "Couldn't reach the AI service. Check your connection and try again." |
| anything else | "Something went wrong on our side. Please try again." |

Error card design:
- Rounded card, `border-destructive/40`, `bg-destructive/5`.
- Icon (material `error` or `sentiment_dissatisfied`) + bold one-line headline + the mapped message.
- "Try again" button that re-submits the last query.
- Collapsible "Technical details" `<details>` keeps the raw message for debugging.

### Out of scope
- Streaming partial results, progress %, cancel button, retry-with-backoff, toast notifications.
