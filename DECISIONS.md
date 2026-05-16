# Decisions Log — Case 2: Pocket — Roommate Expense Splitter

## Assumptions I made

1. **Groups are the unit of truth** — all expenses and balances are scoped to a group. A user can be in multiple groups with independent balances.
2. **Settle up records are immutable** — once a settlement is recorded it stays in the audit trail. Editing is out of scope; delete + re-add if wrong.
3. **Currency conversion is display-layer only** — expenses are always stored in the group's base currency. The entered currency is converted at submission time using live rates.
4. **Recurring expenses are templates, not schedules** — a recurring expense generates a copy on the next page load after the due day, not via a background job. Good enough for a demo; production would use a cron.
5. **Demo account is a first-class user** — the `demo@pocket.app` Supabase auth user auto-joins the seeded "Flatmates" group on first login so judges see real data immediately.

## Trade-offs

| Choice | Alternative | Why I picked this |
|---|---|---|
| Next.js 16 App Router + Server Actions | Express REST API | Co-locates data fetching with UI, eliminates a separate API layer, faster to ship |
| Supabase Auth | NextAuth / Clerk | Already using Supabase Postgres; same SDK handles auth + DB, zero extra cost |
| Prisma ORM | Drizzle / raw SQL | Type-safe schema migrations, readable relation syntax, excellent DX for rapid iteration |
| PostgreSQL (Supabase) | SQLite | Free hosted Postgres, no file-system constraints on Vercel, scales beyond a laptop |
| Base UI (headless) | shadcn/ui Radix | Slightly lower-level but ships with Tailwind v4 compatibility out of the box |
| Greedy two-pointer for netting | Exact min-transactions (NP-hard) | O(n log n) vs. exponential; greedy is optimal for the common case and explainable to non-engineers |
| `open.er-api.com` for FX rates | Fixer.io / Open Exchange Rates | Free, no API key, CORS-friendly, cached server-side for 1 hour — good enough for a demo |

## What I de-scoped and why

- **Email notifications** — Supabase emails for magic link work; proactive "you owe X" notifications would need a queue (Resend/Postmark) — out of scope for the time box.
- **Push notifications** — requires a service worker + VAPID keys. Not justified for a 1-day build.
- **Expense editing** — delete + re-add covers the use case. Edit adds significant UI and audit-trail complexity.
- **Mobile app** — the web app is responsive. A native app is a separate project.
- **Group deletion** — destructive operation with cascading debt implications. Soft-delete of expenses is already implemented.

## What I'd do differently with another day

- Add proper email notifications when a balance crosses a threshold ("Rahul now owes you ₹2,000")
- Snapshot exchange rates at expense creation time (currently converts at submission, which is correct, but the rate isn't stored)
- Add end-to-end tests (Playwright) covering the netting algorithm with known inputs
- Replace the lazy recurring-expense generation (on page load) with a proper cron via Vercel Cron Jobs
- Add a group-level summary chart showing balance history over time
