import { createClient } from "npm:@supabase/supabase-js@2";

const localOrigins = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function allowedOrigins(): Set<string> {
  const configured = (Deno.env.get("CHICC_STOREFRONT_ORIGIN") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([...localOrigins, ...configured]);
}

function responseHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function validAddress(value: unknown): value is JsonObject {
  if (!isObject(value)) return false;
  const street = typeof value.street === "string" ? value.street.trim() : "";
  const city = typeof value.city === "string" ? value.city.trim() : "";
  return street.length > 0 && street.length <= 300 && city.length > 0 && city.length <= 120;
}

function getClientIp(request: Request): string {
  const trustedEdgeIp = request.headers.get("cf-connecting-ip");
  if (trustedEdgeIp) return trustedEdgeIp.trim().slice(0, 128);
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",").at(-1)?.trim().slice(0, 128) || "unknown";
  return "unknown";
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? "";
  const origins = allowedOrigins();
  if (!origins.has(origin)) {
    return Response.json({ error: "Origin is not allowed." }, { status: 403 });
  }
  const headers = responseHeaders(origin);

  if (request.method === "OPTIONS") return new Response("ok", { status: 200, headers });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405, headers });

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 16_384) return Response.json({ error: "Request is too large." }, { status: 413, headers });

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 16_384) {
      return Response.json({ error: "Request is too large." }, { status: 413, headers });
    }
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400, headers });
  }

  if (!isObject(body)) return Response.json({ error: "Invalid request." }, { status: 400, headers });
  if (typeof body.company_website === "string" && body.company_website.trim()) {
    return Response.json({ error: "Invalid request." }, { status: 400, headers });
  }

  const customerName = typeof body.customer_name === "string" ? body.customer_name.trim() : "";
  const customerPhone = typeof body.customer_phone === "string" ? body.customer_phone.trim() : "";
  const deliveryNotes = typeof body.delivery_notes === "string" ? body.delivery_notes.trim() : "";
  if (customerName.length < 1 || customerName.length > 120 || customerPhone.length < 5 || customerPhone.length > 40) {
    return Response.json({ error: "Check the customer name and phone number." }, { status: 400, headers });
  }
  if (deliveryNotes.length > 2000 || !validAddress(body.delivery_address)) {
    return Response.json({ error: "Check the delivery address." }, { status: 400, headers });
  }
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) {
    return Response.json({ error: "Choose at least one product." }, { status: 400, headers });
  }

  const items: { product_id: string; quantity: number }[] = [];
  for (const value of body.items) {
    if (!isObject(value) || typeof value.product_id !== "string" || !uuidPattern.test(value.product_id)) {
      return Response.json({ error: "Invalid product selection." }, { status: 400, headers });
    }
    const quantity = Number(value.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 25) {
      return Response.json({ error: "Invalid product quantity." }, { status: 400, headers });
    }
    items.push({ product_id: value.product_id, quantity });
  }

  const projectUrl = Deno.env.get("SUPABASE_URL");
  const secretKey = Deno.env.get("CHICC_SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!projectUrl || !secretKey) {
    return Response.json({ error: "Order service is not configured." }, { status: 503, headers });
  }

  const supabase = createClient(projectUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const ipHash = await sha256(getClientIp(request));
  const { data: withinLimit, error: rateLimitError } = await supabase.rpc("consume_website_order_rate_limit", {
    p_ip_hash: ipHash,
  });
  if (rateLimitError) return Response.json({ error: "Order service is temporarily unavailable." }, { status: 503, headers });
  if (!withinLimit) return Response.json({ error: "Please try again later." }, { status: 429, headers });

  const { error: orderError } = await supabase.rpc("create_website_order", {
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_delivery_address: body.delivery_address,
    p_delivery_notes: deliveryNotes || null,
    p_items: items,
  });
  if (orderError) {
    return Response.json({ error: "We could not place this order. Check that every item is still available." }, { status: 400, headers });
  }

  return Response.json({ success: true }, { status: 201, headers });
});
