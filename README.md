# Pocket — Split expenses, settle simply.

A stripped-down expense splitter focused on one job: at any moment, anyone in the group should know — in one glance — who owes whom and how much.

**Live demo:** [your-vercel-url.vercel.app](https://your-vercel-url.vercel.app)

**Demo login:** Click "Try Demo Account" on the login page. No sign-up needed.

---

## Features

### Core
- **Groups** — Create a group, share an invite link/code, members join instantly
- **Expenses** — Add expenses with equal, custom amount, or percentage splits
- **Balances** — Clean "who owes whom" view using a transaction-minimizing algorithm
- **Settle up** — One-tap settlement that updates balances and writes to the audit trail
- **Activity feed** — Full audit trail of every expense, deletion, and settlement

### Stretch goals
- **Recurring expenses** — Mark any expense as monthly; it auto-generates on the configured day each month
- **Receipt upload** — Attach a photo or PDF receipt to any expense (stored in Supabase Storage)
- **Export CSV** — Download the full group ledger (expenses + settlements) as a spreadsheet

### Multi-currency
Enter any expense in a foreign currency — the app fetches live exchange rates and converts to the group's base currency before saving.

---

## How the netting algorithm works

Given net balances for each person, the algorithm minimizes the number of transactions needed to settle everyone using a greedy two-pointer approach:

1. Compute each person's **net balance** (total paid − total owed across all expenses and settlements)
2. Split into two lists: **creditors** (net > 0) and **debtors** (net < 0), sorted by magnitude
3. Greedily match the largest debtor to the largest creditor — one transaction clears as much debt as possible
4. Repeat until all balances are zero

**Example — 3 people:**
```
Alice paid ₹1200 (split 40/30/30) → Alice +₹840, Bob −₹360, Carol −₹480
Bob paid ₹600 (split equal)       → Alice −₹200, Bob +₹400, Carol −₹200

Net: Alice +₹640, Bob +₹40, Carol −₹680

Algorithm output (2 transactions instead of naive 3):
  Carol → Alice  ₹640
  Carol → Bob    ₹40
```

A→B + B→C nets out automatically — no unnecessary hops.

---

## Currency conversion note

The current implementation fetches live rates from [open.er-api.com](https://open.er-api.com) (free tier, cached server-side for 1 hour) and converts foreign-currency expense amounts into the group's base currency before persisting.

**To make this production-grade at international scale:**

- **Store original currency + amount** alongside the converted amount on the `Expense` record so the source data is never lost
- **Snapshot the exchange rate at the time of entry** (not at query time) — balances must be deterministic; re-querying rates later would silently change settled debts
- **Per-group base currency** is already in the schema (`Group.currency`); extend to per-user preferred display currency with a conversion layer at render time
- **Rate provider** — swap the free tier for a paid provider (Fixer.io, Open Exchange Rates) with higher rate limits and SLA guarantees for production
- **Rounding** — use banker's rounding (round-half-to-even) and track rounding remainders to prevent ₹0.01 drift accumulating across many splits

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | Supabase Auth (magic link + demo account) |
| Styling | Tailwind CSS v4 |
| Deployment | Vercel |

---

## Running locally

```bash
# 1. Clone and install
git clone https://github.com/Pratham061204/pocket.git
cd pocket
npm install

# 2. Set environment variables
cp .env.local.example .env.local
# Fill in your Supabase URL, anon key, and DB connection strings

# 3. Push schema and seed demo data
npx prisma db push
npx prisma db seed

# 4. Start dev server
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `DATABASE_URL` | Postgres connection string (pooled, port 6543) |
| `DIRECT_URL` | Postgres direct connection string (port 5432) |
| `NEXT_PUBLIC_SITE_URL` | Deployed URL (for auth redirects) |
