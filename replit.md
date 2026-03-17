# Auto-Pay Cancel Assistant

A full-stack SaaS app that helps users identify, manage, and cancel unwanted recurring payments, with bank account integration via Plaid, Stripe subscription billing, and step-by-step cancellation workflows.

## Architecture

This is a **pnpm monorepo** with path-based routing:
- `/` → Frontend (React + Vite) at `artifacts/autopay-cancel/` (port 25613)
- `/api` → Express API server at `artifacts/api-server/` (port 8080)
- `/api/stripe/webhook` → Stripe webhook endpoint (registered BEFORE express.json())
- Database → PostgreSQL via `DATABASE_URL`; shared schema in `lib/db/`

## Key Packages & Integration Points

- **Frontend**: React + Vite, TailwindCSS, shadcn/ui, react-plaid-link, wouter routing
- **Backend**: Express.js, Drizzle ORM, JWT auth, Plaid SDK, Stripe SDK
- **Stripe**: `stripe` + `stripe-replit-sync` for webhook/data sync to `stripe.*` DB schema
- **Auth**: JWT tokens, bcrypt hashing, rate limiting via express-rate-limit

## Project Structure

```
artifacts/
├── api-server/src/
│   ├── app.ts              # Express app (webhook BEFORE express.json)
│   ├── index.ts            # Server entry: initStripe() → listen
│   ├── stripeClient.ts     # getUncachableStripeClient(), getStripeSync()
│   ├── stripeService.ts    # getOrCreateStripeCustomer, checkout, portal
│   ├── webhookHandlers.ts  # WebhookHandlers.processWebhook()
│   ├── middlewares/
│   │   ├── auth.ts         # requireAuth middleware
│   │   └── rateLimiter.ts  # globalLimiter, authLimiter
│   └── routes/
│       ├── index.ts        # Router registration
│       ├── auth.ts         # /api/auth/register, /api/auth/login
│       ├── stripe.ts       # /api/stripe/plans, /checkout, /portal, /subscription
│       ├── plaid.ts        # /api/plaid/create-link-token, /exchange-token
│       ├── accounts.ts     # /api/accounts (bank accounts)
│       ├── payments.ts     # /api/payments (recurring payments)
│       ├── dashboard.ts    # /api/dashboard/stats
│       ├── documents.ts    # /api/documents (cancellation docs)
│       └── health.ts       # /api/healthz
│
└── autopay-cancel/src/
    ├── App.tsx             # Routing: /, /login, /register, /dashboard, /accounts,
    │                       #          /payments, /documents, /settings
    ├── lib/auth.tsx        # AuthProvider, useAuth hook
    └── pages/
        ├── login.tsx
        ├── register.tsx
        ├── dashboard.tsx
        ├── accounts.tsx    # Plaid Link integration + demo mode
        ├── payments.tsx    # List/manage recurring payments
        ├── documents.tsx   # Generate cancellation documents
        └── settings.tsx    # Stripe plans display + checkout/portal

lib/
├── db/src/
│   ├── index.ts            # Drizzle client export: db, pool
│   └── schema/
│       ├── users.ts        # users table with stripeCustomerId, stripeSubscriptionId
│       ├── bank-accounts.ts # bank_accounts with plaidAccessToken, plaidItemId
│       ├── recurring-payments.ts
│       └── user-actions.ts
└── api-zod/src/            # Shared zod validation schemas

scripts/src/
├── seed-products.ts        # Creates Stripe products ($7.99/month, $59.99/year)
└── stripeClient.ts         # getUncachableStripeClient() for scripts
```

## Stripe Integration

**Credentials**: `STRIPE_SECRET_KEY` stored as shared env var (from Replit Stripe integration).

**Flow**:
1. On startup: `runMigrations()` → `getStripeSync()` → `findOrCreateManagedWebhook()` → `syncBackfill()`
2. Products sync to `stripe.*` DB schema tables automatically via webhooks
3. `/api/stripe/plans` queries `stripe.products` + `stripe.prices` from DB
4. Checkout creates Stripe Checkout Session; Portal opens Customer Portal

**Products (already seeded)**:
- Product: Auto-Pay Cancel Assistant (`prod_UAQYiUiFCADcIW`)
- Monthly: $7.99/month (`price_1TC5hXKGqoYLhKzFhciMBHzu`)
- Annual: $59.99/year (`price_1TC5hXKGqoYLhKzF7ky0rNtd`)

## Plaid Integration

**Status**: Demo mode (no credentials). Set `PLAID_CLIENT_ID` and `PLAID_SECRET` for real bank connections.

**Demo mode**: Auto-seeds 5 sample recurring payments when accounts are connected.

## Security

- **Helmet**: CSP, HSTS, X-Frame-Options, etc.
- **CORS**: Configured for Replit domains
- **Rate limiting**: 10 req/15min for auth routes, 200 req/15min global
- **JWT**: HS256 tokens, 7-day expiry

## Running Seed Script

```bash
pnpm --filter @workspace/scripts exec tsx src/seed-products.ts
```

## Environment Variables

| Variable | Description | Status |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by Replit DB |
| `STRIPE_SECRET_KEY` | Stripe test secret key | Set from Replit Stripe integration |
| `JWT_SECRET` | JWT signing secret | Defaults to dev key (set in prod) |
| `PLAID_CLIENT_ID` | Plaid API client ID | Optional (demo mode if unset) |
| `PLAID_SECRET` | Plaid API secret | Optional (demo mode if unset) |
