import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Hotmart sends a hottok query param to verify the request origin.
// Set HOTMART_HOTTOK in Supabase Edge Function secrets to match the value
// configured in Hotmart Dashboard → Tools → Webhooks (Postback).
const EXPECTED_HOTTOK = Deno.env.get("HOTMART_HOTTOK");

Deno.serve(async (req) => {
  // Hotmart sends POST with JSON body
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify hottok if configured
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

  // Hotmart postback structure: { event, data: { buyer: { email }, purchase: { status, transaction } } }
  const event = (body.event as string) ?? "";
  const data = body.data as Record<string, unknown> | undefined;
  const buyer = data?.buyer as Record<string, unknown> | undefined;
  const purchase = data?.purchase as Record<string, unknown> | undefined;

  const buyerEmail = buyer?.email as string | undefined;
  const purchaseStatus = purchase?.status as string | undefined;
  const transaction = purchase?.transaction as string | undefined;

  console.log(`Hotmart event: ${event} | email: ${buyerEmail} | status: ${purchaseStatus}`);

  if (!buyerEmail) {
    return new Response(JSON.stringify({ ok: false, reason: "no buyer email" }), {
      status: 200, // return 200 so Hotmart doesn't retry
      headers: { "Content-Type": "application/json" },
    });
  }

  // Find user by email
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, plan")
    .eq("email", buyerEmail);

  if (profileError || !profiles || profiles.length === 0) {
    // User hasn't registered yet — log and return OK so Hotmart doesn't keep retrying.
    // They'll be activated once they register (you can handle this manually via admin panel).
    console.warn(`No profile found for email: ${buyerEmail}`);
    return new Response(JSON.stringify({ ok: false, reason: "user not found" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = profiles[0].id;

  // PURCHASE_COMPLETE or PURCHASE_APPROVED → activate Pro
  if (
    event === "PURCHASE_COMPLETE" ||
    event === "PURCHASE_APPROVED" ||
    purchaseStatus === "COMPLETE" ||
    purchaseStatus === "APPROVED"
  ) {
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

    console.log(`Activated Pro for ${buyerEmail} (${userId})`);
  }

  // PURCHASE_REFUNDED / PURCHASE_CANCELED / SUBSCRIPTION_CANCELLATION → downgrade
  if (
    event === "PURCHASE_REFUNDED" ||
    event === "PURCHASE_CANCELED" ||
    event === "SUBSCRIPTION_CANCELLATION" ||
    purchaseStatus === "REFUNDED" ||
    purchaseStatus === "CANCELED"
  ) {
    await supabaseAdmin
      .from("profiles")
      .update({ plan: "free", trial_ends_at: null, hotmart_transaction: null })
      .eq("id", userId);

    console.log(`Downgraded ${buyerEmail} to free`);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
