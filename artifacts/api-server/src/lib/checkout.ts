// Framework-agnostic Stripe Checkout logic. Uses only `fetch`, so it runs in
// both the Node/Express server and the Cloudflare Worker.

export interface CheckoutEnv {
  STRIPE_SECRET_KEY?: string;
  PUBLIC_STORE_URL?: string;
}

export interface CheckoutResult {
  status: number;
  body: { url: string } | { error: string };
}

const checkoutProducts: Record<string, { name: string; price: number }> = {
  "field-notes-headphones": { name: "Field Notes Closed-Back Headphones", price: 189 },
  "little-signal-speaker": { name: "Little Signal Bookshelf Speakers", price: 349 },
  "orbit-turntable": { name: "Orbit Manual Turntable", price: 429 },
  "quiet-current-dac": { name: "Quiet Current USB DAC", price: 129 },
  "everyday-usbc": { name: "Everyday USB-C Audio Cable", price: 24 },
  "studio-monitor-one": { name: "Studio Monitor One", price: 279 },
  "open-air-wireless": { name: "Open Air Wireless Headphones", price: 149 },
  "listening-room-amp": { name: "Listening Room Integrated Amp", price: 549 },
  "needle-and-groove-kit": { name: "Needle & Groove Record Care Kit", price: 39 },
  "desktop-dac-plus": { name: "Desktop DAC Plus", price: 219 },
  "balanced-interconnects": { name: "Balanced Interconnect Pair", price: 59 },
  "nearfield-stands": { name: "Nearfield Monitor Stands", price: 89 },
};

const fail = (status: number, error: string): CheckoutResult => ({ status, body: { error } });

export async function createCheckoutSession(
  requestBody: unknown,
  env: CheckoutEnv,
): Promise<CheckoutResult> {
  const secretKey = env.STRIPE_SECRET_KEY;
  const storeUrl = env.PUBLIC_STORE_URL;

  if (!secretKey || !storeUrl) {
    return fail(503, "Payments are not configured. Add Stripe test credentials and the public store URL.");
  }

  if (!secretKey.startsWith("sk_test_")) {
    return fail(503, "Only Stripe test-mode checkout is enabled for this demo.");
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(storeUrl);
  } catch {
    return fail(500, "The public store URL is invalid.");
  }

  const isLocalDevelopment =
    baseUrl.protocol === "http:" &&
    (baseUrl.hostname === "localhost" || baseUrl.hostname === "127.0.0.1");
  if (
    (baseUrl.protocol !== "https:" && !isLocalDevelopment) ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.search ||
    baseUrl.hash
  ) {
    return fail(500, "The public store URL must use HTTPS.");
  }

  const payload =
    typeof requestBody === "object" && requestBody !== null ? requestBody : null;
  const items = payload && "items" in payload ? payload.items : undefined;
  const email = payload && "email" in payload ? payload.email : undefined;
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 12 ||
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return fail(400, "Provide a valid email and a non-empty cart.");
  }

  const normalizedItems: Array<{ id: string; quantity: number }> = [];
  for (const item of items) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("productId" in item) ||
      !("quantity" in item) ||
      typeof item.productId !== "string" ||
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 10 ||
      !Object.hasOwn(checkoutProducts, item.productId)
    ) {
      return fail(400, "The cart contains an invalid product or quantity.");
    }

    normalizedItems.push({ id: item.productId, quantity: item.quantity });
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("customer_email", email);
  params.set("success_url", new URL("/checkout/success?session_id={CHECKOUT_SESSION_ID}", baseUrl).toString());
  params.set("cancel_url", new URL("/cart", baseUrl).toString());
  params.set("shipping_address_collection[allowed_countries][0]", "US");
  params.set("allowed_payment_method_types[0]", "card");
  params.set("allowed_payment_method_types[1]", "us_bank_account");
  params.set("billing_address_collection", "required");

  let subtotalCents = 0;
  for (const [index, item] of normalizedItems.entries()) {
    const product = checkoutProducts[item.id];
    subtotalCents += product.price * 100 * item.quantity;
    params.set(`line_items[${index}][price_data][currency]`, "usd");
    params.set(`line_items[${index}][price_data][unit_amount]`, String(product.price * 100));
    params.set(`line_items[${index}][price_data][product_data][name]`, product.name);
    params.set(`line_items[${index}][quantity]`, String(item.quantity));
  }

  params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  params.set("shipping_options[0][shipping_rate_data][display_name]", subtotalCents >= 9900 ? "Free standard shipping" : "Standard shipping");
  params.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", subtotalCents >= 9900 ? "0" : "895");
  params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");
  params.set("metadata[store]", "signal-supply-demo");

  try {
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const stripeBody: unknown = await stripeResponse.json();

    if (
      !stripeResponse.ok ||
      typeof stripeBody !== "object" ||
      stripeBody === null ||
      !("url" in stripeBody) ||
      typeof stripeBody.url !== "string"
    ) {
      return fail(
        502,
        "Stripe could not start checkout. Check that card and US bank-account payments are enabled in Stripe test mode.",
      );
    }

    const checkoutUrl = new URL(stripeBody.url);
    if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com") {
      return fail(502, "Stripe returned an unexpected checkout address.");
    }

    return { status: 200, body: { url: checkoutUrl.toString() } };
  } catch {
    return fail(502, "Could not reach Stripe. Please try again.");
  }
}
