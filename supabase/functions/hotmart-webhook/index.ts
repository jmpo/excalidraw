import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const EXPECTED_HOTTOK = Deno.env.get("HOTMART_HOTTOK");

// Events that mean the user paid successfully
const PAID_EVENTS = new Set([
  "PURCHASE_COMPLETE",
  "PURCHASE_APPROVED",
  "SUBSCRIPTION_REACTIVATED",
]);

// Events that mean the user is no longer paying
const PAUSED_EVENTS = new Set([
  "PURCHASE_CANCELED",
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "SUBSCRIPTION_CANCELLATION",
]);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify hottok (passed as query param by Hotmart)
  const url = new URL(req.url);
  const hottok = url.searchParams.get("hottok");
  if (EXPECTED_HOTTOK && hottok !== EXPECTED_HOTTOK) {
    console.warn("Invalid hottok:", hottok);
    return new Response("Unauthorized", { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const event = (body.event as string) ?? "";
  const data = body.data as Record<string, unknown> | undefined;
  const buyer = data?.buyer as Record<string, unknown> | undefined;
  const purchase = data?.purchase as Record<string, unknown> | undefined;

  const buyerEmail = buyer?.email as string | undefined;
  const transaction = purchase?.transaction as string | undefined;
  // Hotmart also sends status inside purchase — treat as fallback
  const purchaseStatus = purchase?.status as string | undefined;

  console.log(`Hotmart event: ${event} | status: ${purchaseStatus} | email: ${buyerEmail}`);

  if (!buyerEmail) {
    return ok({ reason: "no buyer email" });
  }

  // Resolve effective event (prefer explicit event name, fallback to status field)
  const effectiveEvent =
    event ||
    (purchaseStatus === "COMPLETE" || purchaseStatus === "APPROVED"
      ? "PURCHASE_COMPLETE"
      : purchaseStatus === "REFUNDED"
      ? "PURCHASE_REFUNDED"
      : purchaseStatus === "CANCELED"
      ? "PURCHASE_CANCELED"
      : "");

  if (!PAID_EVENTS.has(effectiveEvent) && !PAUSED_EVENTS.has(effectiveEvent)) {
    console.log(`Ignored event: ${effectiveEvent}`);
    return ok({ reason: "event ignored" });
  }

  // Find profile by email
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, plan")
    .eq("email", buyerEmail)
    .limit(1);

  if (profileError || !profiles || profiles.length === 0) {
    // User hasn't registered yet — store pending activation so we can handle via admin
    console.warn(`No profile for email: ${buyerEmail} — event: ${effectiveEvent}`);
    return ok({ reason: "user not found" });
  }

  const userId = profiles[0].id as string;

  if (PAID_EVENTS.has(effectiveEvent)) {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        plan: "pro",
        trial_ends_at: null,
        hotmart_transaction: transaction ?? null,
      })
      .eq("id", userId);

    if (error) {
      console.error("Failed to activate Pro:", error.message);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log(`✅ Pro activated for ${buyerEmail}`);
  }

  if (PAUSED_EVENTS.has(effectiveEvent)) {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        plan: "paused",
        hotmart_transaction: transaction ?? null,
      })
      .eq("id", userId);

    if (error) {
      console.error("Failed to pause account:", error.message);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log(`⏸ Account paused for ${buyerEmail}`);
  }

  return ok({ event: effectiveEvent, email: buyerEmail });
});

function ok(data: Record<string, unknown>) {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
