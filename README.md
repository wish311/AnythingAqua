# AnythingAqua

Production-ready starter for a Jellyfin-powered subscription streaming experience.

## Stack
- Backend: Node.js + Express
- Frontend: React + Vite
- Database: PostgreSQL with Prisma ORM
- Auth: JWT (access + refresh tokens) with HTTP-only cookies
- Payments: Stripe Subscriptions
- Media: Jellyfin REST API integration

## Features
- User authentication (signup/login/logout, bcrypt hashing, rate limited auth routes)
- JWT middleware with access + refresh tokens
- Two subscription tiers (standard, premium) with Stripe Checkout + webhook updates
- Jellyfin automation: create users, apply tier policies, disable on cancel
- Media browsing backed by user-specific Jellyfin tokens

## Getting started
### Prerequisites
- Node.js 18+
- PostgreSQL database
- Stripe account with two recurring prices (standard + premium)
- Jellyfin server and admin API token

### Backend setup
```bash
cd server
cp .env.example .env
# edit .env with database url, Stripe keys, Jellyfin URL/token, secrets
npm install
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
npm run dev
```
The API defaults to `http://localhost:4000`.

### Frontend setup
```bash
cd web
cp .env.example .env
npm install
npm run dev
```
The app defaults to `http://localhost:5173` and talks to the backend URL in `VITE_API_URL`.

## Stripe webhook
Expose `POST /api/stripe/webhook` to Stripe. Use the `STRIPE_WEBHOOK_SECRET` from your dashboard. Events handled:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Jellyfin integration
The backend uses the admin token to:
- `POST /Users/New` to create users
- `POST /Users/{id}/Policy` to apply tier permissions (downloads enabled for premium)
- `POST /Users/AuthenticateByName` to capture a user access token for browsing
- `GET /Items` to list libraries/media per user token

## Running in production
- Serve the backend behind HTTPS and set `COOKIE_SECURE=true`
- Configure a reverse proxy or Stripe CLI tunnel for webhooks
- Build the frontend (`npm run build` in `web`) and host behind your preferred static server
