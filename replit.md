# Auto-Pay Cancel Assistant

## Overview

A full-stack SaaS application that helps users identify, manage, and cancel unwanted recurring payments by combining bank account simulation with guided cancellation workflows and legal document generation.

**Tagline:** "Take control of your subscriptions. Cancel with confidence."

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 18 + Vite + Tailwind CSS v4 + Shadcn/UI
- **Backend**: Express 5 + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (bcryptjs for passwords, jsonwebtoken for tokens)
- **Validation**: Zod + Orval codegen from OpenAPI spec
- **Charts**: Recharts
- **Animations**: Framer Motion

## Features

1. **Authentication** — Register/Login with 7-day free trial, JWT tokens
2. **Dashboard** — Summary stats (monthly spend, subscriptions count, savings)
3. **Subscriptions** — List/filter all recurring payments with cancellation difficulty
4. **Subscription Detail** — Step-by-step cancellation workflow for each merchant
5. **Accounts** — Connect bank accounts (simulated), auto-detects 5 sample subscriptions
6. **Documents** — Generate cancellation emails, ACH revocation letters, stop-payment forms
7. **Settings** — Profile management, sign out

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── autopay-cancel/     # React + Vite frontend (served at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## API Routes

- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user (JWT required)
- `POST /api/auth/logout` — Logout
- `GET /api/accounts` — Get connected bank accounts
- `POST /api/accounts` — Connect bank account (auto-seeds 5 sample payments)
- `DELETE /api/accounts/:id` — Disconnect bank account
- `GET /api/payments` — Get recurring payments (filterable by status/accountId)
- `GET /api/payments/:id` — Get single payment
- `PATCH /api/payments/:id` — Update payment status (active/cancelled/disputed)
- `GET /api/payments/:id/workflow` — Get step-by-step cancellation workflow
- `POST /api/documents/email-template` — Generate cancellation email
- `POST /api/documents/ach-revocation` — Generate ACH revocation letter
- `POST /api/documents/stop-payment` — Generate stop payment form
- `GET /api/dashboard/summary` — Get dashboard summary stats

## Database Schema

- `users` — user accounts with subscription status and trial end date
- `bank_accounts` — connected bank accounts per user
- `recurring_payments` — detected recurring charges with merchant info
- `user_actions` — activity log (cancelled, detected, disputed, saved)

## Key Design Decisions

- Bank connection is simulated (no real Plaid API key needed) — when a user connects a bank account, 5 realistic sample subscriptions are auto-detected
- JWT tokens stored in localStorage as `auth_token`
- Trust messaging throughout: "We provide tools and guidance, not a service that acts for you"
- Cancellation difficulty ratings: easy (green), medium (amber), hard (red)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)
- `JWT_SECRET` — Optional override (defaults to dev key)
- `PORT` — Server port (auto-set by Replit)
