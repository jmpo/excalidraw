// Meta Conversions API — server-side event relay
// Receives events from the frontend and forwards them to Meta's CAPI
// with hashed user data for maximum match quality.

const PIXEL_ID    = Deno.env.get("META_PIXEL_ID")!;
const CAPI_TOKEN  = Deno.env.get("META_CAPI_TOKEN")!;
const CAPI_URL    = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

// SHA-256 hash (Meta requires lowercase trimmed before hashing)
async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

  const {
    eventName,
    eventId,
    customData = {},
    userData = {},
  } = body as {
    eventName: string;
    eventId?: string;
    customData?: Record<string, unknown>;
    userData?: {
      email?: string;
      firstName?: string;
      fbp?: string;
      fbc?: string;
      userAgent?: string;
      pageUrl?: string;
      clientIp?: string;
    };
  };

  if (!eventName) return new Response(JSON.stringify({ ok: false, reason: "no eventName" }), { status: 200 });

  // Build hashed user_data for matching quality
  const ud: Record<string, unknown> = {};
  if (userData.email)     ud.em = [await sha256(userData.email)];
  if (userData.firstName) ud.fn = [await sha256(userData.firstName)];
  if (userData.fbp)       ud.fbp = userData.fbp;
  if (userData.fbc)       ud.fbc = userData.fbc;
  if (userData.userAgent) ud.client_user_agent = userData.userAgent;
  // IP is best-effort from request headers
  const ip = userData.clientIp
    ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip");
  if (ip) ud.client_ip_address = ip;

  const payload = {
    data: [{
      event_name:    eventName,
      event_time:    Math.floor(Date.now() / 1000),
      event_id:      eventId ?? `capi-${Date.now()}`,
      action_source: "website",
      event_source_url: userData.pageUrl ?? "https://edudraw.chatea.click",
      user_data:     ud,
      custom_data:   Object.keys(customData).length > 0 ? customData : undefined,
    }],
    // test_event_code: "TEST12345", // uncomment to test in Meta Events Manager
  };

  const res = await fetch(`${CAPI_URL}?access_token=${CAPI_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  console.log(`CAPI ${eventName} [${eventId}]:`, res.status, JSON.stringify(result));

  return new Response(JSON.stringify({ ok: res.ok, ...result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
