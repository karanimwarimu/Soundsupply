// Cloudflare Worker entry: handles /api/* and lets the static-assets binding
// serve the built storefront (with SPA fallback configured in wrangler.jsonc).
import { createCheckoutSession } from "../../api-server/src/lib/checkout";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  STRIPE_SECRET_KEY?: string;
  PUBLIC_STORE_URL?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/healthz" && request.method === "GET") {
      return json({ status: "ok" });
    }

    if (pathname === "/api/checkout/session") {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Request body must be JSON." }, 400);
      }
      const result = await createCheckoutSession(body, env);
      return json(result.body, result.status);
    }

    if (pathname.startsWith("/api/")) {
      return json({ error: "Not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
