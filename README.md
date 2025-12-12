# AnythingAqua

Secure, production-ready starter for a Jellyfin-powered subscription streaming app.

## Stack
- Backend: Node.js + Express, Prisma (PostgreSQL), Stripe webhooks, Jellyfin REST
- Frontend: React + Vite with React Router
- Auth: JWT access + refresh tokens stored in HTTP-only cookies
- Payments: Stripe Checkout (standard / premium tiers)
- Media: Jellyfin admin automation for user creation and policies

## Prerequisites
- Node.js 18+
- PostgreSQL instance
- Stripe account with two recurring prices (standard + premium)
- Jellyfin server and an admin API token

## Environment configuration
### Backend (`server/.env`)
```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/anythingaqua
JWT_ACCESS_SECRET=replace_me_access_secret
JWT_REFRESH_SECRET=replace_me_refresh_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
STRIPE_SECRET_KEY=sk_test_yourkey
STRIPE_WEBHOOK_SECRET=whsec_yoursecret
STRIPE_STANDARD_PRICE_ID=price_standard
STRIPE_PREMIUM_PRICE_ID=price_premium
FRONTEND_URL=http://localhost:5173        # comma-separated list allowed for CORS
BACKEND_URL=http://localhost:4000
JELLYFIN_BASE_URL=http://localhost:8096
JELLYFIN_API_TOKEN=admin_api_token
COOKIE_SECURE=false
```

### Frontend (`web/.env`)
```
VITE_API_URL=http://localhost:4000
```

### Stripe setup
1. Create two recurring products in Stripe (Standard, Premium).
2. Copy the Price IDs into `STRIPE_STANDARD_PRICE_ID` and `STRIPE_PREMIUM_PRICE_ID`.
3. Create a webhook endpoint pointing to `POST {BACKEND_URL}/api/stripe/webhook` with events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Use the signing secret as `STRIPE_WEBHOOK_SECRET`.

### Jellyfin setup
- Create an admin API token and place it in `JELLYFIN_API_TOKEN`.
- Ensure the server base URL is reachable by the backend (e.g., `http://localhost:8096`).
- Users are created only after active subscriptions, and policies are applied per tier:
  - Standard: streaming only (downloads disabled)
  - Premium: streaming + downloads

## Install & run
At repo root:
```
npm install
npm run dev
```
- Backend: http://localhost:4000
- Frontend: http://localhost:5173

### Production build
```
npm run build
npm run start   # starts backend; serve frontend build separately (e.g., static hosting)
```

### Prisma
```
cd server
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
```
Run `npx prisma migrate dev --name init` after configuring your database.

### Testing Stripe webhooks locally
```
stripe listen --forward-to localhost:4000/api/stripe/webhook
```
Use `STRIPE_WEBHOOK_SECRET` from the CLI output.

## API highlights
- `POST /api/auth/signup|login` (HTTP-only cookies for tokens)
- `POST /api/auth/logout`
- `POST /api/subscription/checkout` (requires auth, tier in body)
- `POST /api/jellyfin/provision` (auth + active subscription)
- `GET /api/media/libraries` (auth + subscription)
- `GET /api/public/media-stats` (public, rate limited, cached)
- `POST /api/stripe/webhook` (Stripe-signed, idempotent)

## Frontend pages
- `/` Home with public media stats + CTA to pricing
- `/pricing` Tier selection with checkout buttons
- `/signup` and `/login` with validation and error states
- `/checkout/success` and `/checkout/cancel` to match Stripe return URLs
- `/onboarding/jellyfin` to create the Jellyfin user after payment
- `/dashboard` for subscription status and library browsing
- `/account` for renewal info and logout

## Security notes
- HTTPS recommended with `COOKIE_SECURE=true` in production.
- CORS allowlist uses `FRONTEND_URL` (comma-separated origins).
- Rate limiting protects auth, public stats, and webhook routes.
- No Jellyfin passwords are stored—only sent once to the admin API.
- Stripe webhook signature is verified and processed idempotently.

## Troubleshooting
- **Webhook signature errors**: confirm `STRIPE_WEBHOOK_SECRET` matches the configured endpoint and that raw body parsing is enabled (already configured on `/api/stripe/webhook`).
- **CORS failures**: ensure `FRONTEND_URL` matches the actual origin (include protocol + port). Multiple origins can be comma separated.
- **Jellyfin timeouts**: verify `JELLYFIN_BASE_URL` is reachable from the backend and the admin token is valid.
- **Database errors**: confirm `DATABASE_URL` is correct and run Prisma migrations.

## Verification checklist
- `npm run dev` (runs backend on 4000 and frontend on 5173)
- Visit `http://localhost:5173` → Home shows public media stats
- Create user via `/signup` then login
- Start checkout from `/pricing` → Stripe page
- After successful payment, go to `/onboarding/jellyfin` and create a Jellyfin user
- Browse libraries on `/dashboard`
- Check `GET /api/public/media-stats` responds without auth
