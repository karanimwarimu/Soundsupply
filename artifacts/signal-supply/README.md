# Signal Supply storefront

The Signal Supply app is the storefront at `/`. Its current catalog and cart are demo data stored in the browser. Product photography is loaded from Unsplash URLs and should be replaced with supplier-approved images before real sales.

## Local development

Run the API server in one terminal:

```sh
PORT=8080 pnpm --filter @workspace/api-server run dev
```

Run the storefront in another terminal:

```sh
PORT=18499 BASE_PATH=/ pnpm --filter @workspace/signal-supply run dev
```

Open `http://localhost:18499`. Vite proxies `/api` requests to the local API server.

## Stripe test checkout

Checkout uses Stripe-hosted Checkout, which keeps card and bank details off the storefront. The API server only accepts a Stripe **test** secret key and offers card plus US bank-account (ACH) payment methods when enabled in the Stripe account.

Set these API-server environment variables before using checkout:

- `STRIPE_SECRET_KEY`: a Stripe test secret key (`sk_test_...`)
- `PUBLIC_STORE_URL`: the storefront base URL (`http://localhost:18499` for local work; use the HTTPS deployment URL when hosted)

The API server's `.env.example` shows the local values. Configure secrets through the deployment platform rather than committing them.

This is not a production payment/fulfillment system: the demo does not persist orders, process Stripe webhooks, reconcile stock, calculate tax, or fulfill shipments. Do not configure a live Stripe key or accept real payments until those operations and legal/compliance settings are implemented and tested.
