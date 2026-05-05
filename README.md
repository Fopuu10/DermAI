# DermAI

Full-stack Next.js app for AI-assisted skin health: scans, history, follow-ups, community, chat (Anthropic SDK), gamification, and a mock subscription flow.

## Quick start (Windows)

```powershell
npm install
npm run setup       # prisma generate + db push + seed conditions/articles/badges
npm run dev
```

Open http://localhost:3000

### Enable the Derma chatbot
Edit `.env` and set:
```
ANTHROPIC_API_KEY="sk-ant-..."
```
Without a key, chat falls back to a static safety-first reply (everything else still works).

### Enable real Razorpay payments (India)
Without keys, the subscribe button uses a **mock** flow that instantly activates Premium — useful for development.

For real payments, sign up at razorpay.com, then in `.env`:
```
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."
```
Then point your Razorpay dashboard webhook to `https://<your-domain>/api/webhooks/razorpay` and listen for `payment.captured` and `payment.failed`.

Pricing is in INR: ₹299/mo, ₹799/qtr, ₹1499/yr — edit `src/lib/pricing.ts` to change.

### Make yourself an admin
After signing up, in a Prisma Studio session (`npx prisma studio`) set your user `role` to `admin` to access `/admin`.

## Stack
- **Framework:** Next.js 15 (App Router) + React 19
- **DB:** Prisma + SQLite (file-based, zero setup)
- **Auth:** Custom JWT in HTTP-only cookies (bcrypt hashing)
- **AI:** Rule-based diagnosis engine + Anthropic SDK (Claude Haiku 4.5) for chat
- **UI:** Tailwind, lucide-react

## Project map

```
src/
├── app/
│   ├── page.tsx                  Landing
│   ├── login, signup             Auth pages
│   ├── (app)/                    Protected routes (redirects if not signed in)
│   │   ├── dashboard             Home with health score
│   │   ├── scan                  Camera + form + AI result
│   │   ├── history               Scan list + detail
│   │   ├── followups             Day 7/14/30 check-ins
│   │   ├── community             Posts, comments, upvotes
│   │   ├── chat                  Full chat with sessions
│   │   ├── library               Conditions + articles
│   │   ├── progress              Charts (Premium)
│   │   ├── subscription          Mock checkout
│   │   ├── profile               Skin profile
│   │   └── admin                 Admin dashboard (role=admin)
│   └── api/                      All backend routes
├── components/
│   ├── AppShell.tsx              Sidebar + bottom nav + floating chat
│   ├── ChatDrawer.tsx            Floating chat
│   └── PremiumGate.tsx           Upgrade prompt
└── lib/
    ├── db.ts                     Prisma client
    ├── auth.ts                   JWT + bcrypt + getCurrentUser
    ├── diagnosis.ts              Rule engine + safety overrides
    ├── chat.ts                   Anthropic SDK wrapper + system prompt
    ├── gating.ts                 Free/premium quota enforcement
    ├── health-score.ts           0–100 score recompute
    └── utils.ts                  cn, safeJSON, time helpers
```

## Production checklist (when you're ready)
- Replace mock subscription with real Stripe (`/api/subscription/subscribe` + a webhook route)
- Move from SQLite to Postgres (change `provider` in schema, run `prisma migrate`)
- Move uploaded scan images out of the row (S3/CloudFront) — currently stored as inline data URL
- Set a strong `JWT_SECRET` and rotate it
- Add rate-limiting to `/api/diagnose`, `/api/chat/.../messages`, `/api/auth/*`
- Run a real reminder worker (cron) for the `Reminder` table
- Add CAPTCHA on signup and password reset

## Safety
- Diagnosis engine always returns the global medical disclaimer.
- Names matching `cancer`, `melanoma`, `tumor`, etc. force `Undetermined — See Doctor` with `safety_flag: true`.
- Scary keywords in `extra_notes` plus duration > 21 days → same override.
- Chat system prompt forbids prescription-by-name and definitive diagnoses; urgent-symptom regex forces a "see a doctor" reply.
