# Submission Notes — Case 2: Pocket

## Live URL
<!-- Paste your Vercel deployment URL here -->
https://your-app.vercel.app

## Demo credentials
- **Email:** demo@pocket.app  
- **Password:** Demo1234!  
- Or click **"Try Demo Account"** on the login page (no typing required)

## What to look at first
1. Log in with the demo account → lands on the **Flatmates** group
2. **Balances tab** — shows the minimized "who owes whom" summary (greedy two-pointer algorithm)
3. **Add expense** → try switching currency (e.g. USD), choose **%** split mode or **Amount** split mode
4. **Settle up** → click any debt row involving "you" to record a settlement
5. **Activity** tab — full audit trail
6. **Export CSV** link at the bottom of the expenses tab

## Stretch goals implemented
| Feature | Location |
|---|---|
| Recurring expenses | Toggle in Add Expense sheet; auto-generates on configured day |
| Receipt upload | Paperclip button in Add Expense sheet (Supabase Storage) |
| Multi-currency input | Currency picker in Add Expense; live rates from open.er-api.com |
| CSV export | "Export CSV" link on group page |

## Files the judge should read
- `README.md` — architecture, algorithm explanation, local setup
- `DECISIONS.md` — assumptions, trade-offs, de-scoped features
- `src/lib/balance.ts` — netting algorithm implementation
- `src/lib/recurring.ts` — recurring expense generation
- `src/actions/` — all server actions (expenses, groups, settlements)
- `prisma/schema.prisma` — full data model
