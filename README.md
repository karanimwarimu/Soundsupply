# Signal Supply

A demo e-commerce storefront for an independent audio and electronics shop. It's built with React and TypeScript and runs on Cloudflare Workers, with a Stripe test-mode checkout.

**Live demo:** https://signal-supply.soundsupply.workers.dev

> **Demo only.** Checkout runs in Stripe test mode, so no real payments are taken. Orders aren't saved or shipped, and the catalog is sample data.

## Features

- **Catalog:** browse by category, view product pages and search the catalog
- **Cart:** a cart that persists in the browser
- **Checkout:** Stripe-hosted checkout in test mode (card and US bank account), with prices checked on the server and free shipping over $99
- **Account preview:** sample order history
- **Admin preview:** add catalog items in the browser

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Radix UI, wouter |
| API (hosted) | Cloudflare Worker (`artifacts/signal-supply/worker`) |
| API (local) | Express 5 (`artifacts/api-server`) |
| Payments | Stripe Checkout (test mode) |
| Tooling | pnpm workspaces |

The checkout logic lives in one shared module (`artifacts/api-server/src/lib/checkout.ts`) that uses only `fetch`, so the Cloudflare Worker and the local Express server run the same code.

## Project structure

```
artifacts/
  signal-supply/        Storefront (React + Vite) and its Cloudflare Worker
    src/                Frontend app
    worker/index.ts     Worker entry: serves /api/*, everything else from static assets
    wrangler.jsonc      Cloudflare configuration
  api-server/           Express API for local development
    src/lib/checkout.ts Shared Stripe Checkout logic
lib/                    Shared workspace libraries
```

## Getting started

You need Node.js 22 or later and pnpm 11.

```sh
pnpm install
```

**Option 1: Vite dev server plus Express API.** This gives hot reload.

```sh
# terminal 1
PORT=8080 pnpm --filter @workspace/api-server run dev
# terminal 2
PORT=18499 BASE_PATH=/ pnpm --filter @workspace/signal-supply run dev
```

Then open http://localhost:18499.

**Option 2: Cloudflare runtime.** This runs the app the same way production does.

```sh
cd artifacts/signal-supply
pnpm run cf:dev
```

### Stripe test checkout

To try checkout locally, copy `artifacts/api-server/.env.example` and set:

- `STRIPE_SECRET_KEY`: a Stripe **test** secret key (`sk_test_...`)
- `PUBLIC_STORE_URL`: the storefront base URL

For `pnpm run cf:dev`, put the same values in `artifacts/signal-supply/.dev.vars`. That file is git-ignored.

## Deployment

The storefront deploys to Cloudflare Workers:

```sh
cd artifacts/signal-supply
pnpm run deploy
```

In production, set the secrets in the Cloudflare dashboard (**Workers & Pages → signal-supply → Settings → Variables and Secrets**) or with `npx wrangler secret put <NAME>`.

## Before real sales

This project is a demo, not a production store. Before it could take real orders, it would need:

- Saved orders and Stripe webhook handling
- Stock reconciliation and order fulfillment
- Tax calculation
- Real product data and licensed photography
- Legal and compliance pages
