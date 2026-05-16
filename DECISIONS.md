# Decisions Log — Case 2: Pocket — Roommate Expense Splitter

## Assumptions I made

1. **Groups are the unit of truth** — all expenses and balances are scoped to a group; a user can be in multiple groups with independent balances, because roommate circles don't overlap.
2. **Settle-up records are immutable** — once a settlement is recorded it stays in the audit trail; delete + re-add if wrong, because editing a settled payment causes retroactive confusion about who paid when.
3. **Currency conversion is display-layer only** — expenses are always stored in the group's base currency; the entered currency is converted at submission time using live rates, because storing dual currencies adds schema complexity that wasn't needed for a demo.
4. **Recurring expenses are templates, not schedules** — a recurring expense generates a copy on the next page load after the due day rather than via a background job, because a cron setup (Vercel Cron + queue) would take half the day to wire up for a non-critical feature.
5. **Demo account is a first-class user** — `demo@pocket.app` auto-joins the seeded "Flatmates" group on first login so judges see real data immediately without any manual setup.

## Trade-offs

| Choice | Alternative | Why I picked this |
|---|---|---|
| Next.js 16 App Router + Server Actions | Express REST API | Co-locates data fetching with UI, eliminates a separate API layer, faster to ship |
| Supabase Auth | NextAuth / Clerk | Already using Supabase Postgres; same SDK handles auth + DB, zero extra cost |
| Prisma ORM | Drizzle / raw SQL | Type-safe schema migrations, readable relation syntax, excellent DX for rapid iteration |
| PostgreSQL (Supabase) | SQLite | Free hosted Postgres, no file-system constraints on Vercel, scales beyond a laptop |
| Greedy two-pointer for netting | Exact min-transactions (NP-hard) | O(n log n) vs. exponential; greedy is optimal for the common case and explainable to non-engineers |
| `open.er-api.com` for FX rates | Fixer.io / Open Exchange Rates | Free, no API key, CORS-friendly, cached server-side for 1 hour — good enough for a demo |
| Headless Base UI components | shadcn/ui Radix | Ships with Tailwind v4 compatibility out of the box; fewer version conflicts |

## What I de-scoped and why

- **Email notifications** — Supabase handles magic-link emails; proactive "you owe X" alerts would need a transactional email queue (Resend/Postmark) — not worth the setup time for a demo.
- **Push notifications** — requires a service worker + VAPID keys; the complexity-to-value ratio was too high for a 1-day build.
- **Expense editing** — delete + re-add covers the use case; editing adds significant UI complexity and makes the audit trail ambiguous.
- **Group deletion** — a destructive operation with cascading debt implications; soft-delete of expenses is already implemented.
- **Mobile app** — the web app is fully responsive; a native app is a separate project.

## What I'd do differently with another day

- Snapshot the exchange rate at expense creation time so stored balances remain deterministic even if rates change later.
- Add proactive email notifications (via Resend) when a balance crosses a threshold.
- Replace the lazy recurring-expense generation (on page load) with a proper Vercel Cron job.
- Add end-to-end tests (Playwright) covering the netting algorithm with known fixed inputs.
- Add a group-level balance history chart to visualize how debts evolved over time.
