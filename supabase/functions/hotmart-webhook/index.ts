import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail, emailLayout, btnPrimary, SITE_URL } from "../_shared/resend.ts";

const PIXEL_ID   = Deno.env.get("META_PIXEL_ID")!;
const CAPI_TOKEN = Deno.env.get("META_CAPI_TOKEN")!;

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendCapiEvent(email: string, eventName: string, customData?: Record<string, unknown>) {
  try {
    await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${CAPI_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: `hotmart-${Date.now()}`,
          action_source: "website",
          event_source_url: "https://edudraw.online",
          user_data: { em: [await sha256(email)] },
          custom_data: customData,
        }],
      }),
    });
  } catch (e) {
    console.warn("CAPI error:", e);
  }
}

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

// Checkout abandoned (for sales recovery)
const ABANDONED_EVENTS = new Set([
  "PURCHASE_OUT_OF_SHOPPING_CART",
]);

// Extract a usable phone number from the various Hotmart shapes.
function extractPhone(buyer: Record<string, unknown> | undefined): string | null {
  if (!buyer) return null;
  const code = String(buyer.checkout_phone_code ?? "").trim();
  const num = String(buyer.checkout_phone ?? "").trim();
  if (num) return (code + num).replace(/[^0-9]/g, "") || null;
  // Subscription events nest phone as an object
  const ph = buyer.phone as Record<string, unknown> | undefined;
  if (ph) {
    const cell = (String(ph.dddCell ?? "") + String(ph.cell ?? "")).replace(/[^0-9]/g, "");
    if (cell) return cell;
    const line = (String(ph.dddPhone ?? "") + String(ph.phone ?? "")).replace(/[^0-9]/g, "");
    if (line) return line;
  }
  return null;
}

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
  // Purchase events use data.buyer; subscription events use data.subscriber
  const buyer = (data?.buyer ?? data?.subscriber) as Record<string, unknown> | undefined;
  const purchase = data?.purchase as Record<string, unknown> | undefined;

  // Normalize to lowercase: Supabase Auth stores emails lowercased, so the
  // profile lookup, pending_activations key and the handle_new_user trigger
  // must all compare lowercase or the match silently fails (→ trial instead of Pro).
  const buyerEmail = (buyer?.email as string | undefined)?.trim().toLowerCase();
  const purchaseStatus = purchase?.status as string | undefined;

  // ── Subscription details (period / price / next charge) ──────────────────────
  // Hotmart's payload layout varies by event: PURCHASE_* nest data under
  // data.purchase, while SUBSCRIPTION_* events put fields at data root and use
  // data.subscriber. Read from every known location so both shapes work.
  const subscription = data?.subscription as Record<string, unknown> | undefined;
  const plan = subscription?.plan as Record<string, unknown> | undefined;
  const subscriber = (data?.subscriber ?? subscription?.subscriber) as Record<string, unknown> | undefined;
  const price = purchase?.price as Record<string, unknown> | undefined;

  const transaction = (purchase?.transaction ?? purchase?.order_string ?? subscriber?.code) as string | undefined;

  const planName = String(plan?.name ?? "").toLowerCase();
  // date_next_charge comes as epoch milliseconds; it's the natural expiry anchor
  const dateNextCharge = Number(purchase?.date_next_charge ?? data?.date_next_charge ?? 0) || 0;

  // Derive period from plan name, falling back to the gap until the next charge
  let planPeriod: "monthly" | "annual" | null = null;
  if (/(anual|annual|year|año|ano|yearly)/.test(planName)) {
    planPeriod = "annual";
  } else if (/(mensual|monthly|mes|month)/.test(planName)) {
    planPeriod = "monthly";
  } else if (dateNextCharge) {
    planPeriod = (dateNextCharge - Date.now()) / 86_400_000 > 180 ? "annual" : "monthly";
  }

  // Pro expires at next charge + 3-day grace (covers Hotmart's retry window).
  // If Hotmart didn't send date_next_charge, compute from the period.
  const GRACE_MS = 3 * 86_400_000;
  let proEndsAt: string | null = null;
  if (dateNextCharge) {
    proEndsAt = new Date(dateNextCharge + GRACE_MS).toISOString();
  } else {
    const d = new Date();
    if (planPeriod === "annual") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    proEndsAt = new Date(d.getTime() + GRACE_MS).toISOString();
  }

  const rawPrice = price?.value ?? data?.actual_recurrence_value;
  const planPrice = rawPrice != null ? Number(rawPrice) : null;
  const planCurrency = (price?.currency_value ?? price?.currency_code ?? null) as string | null;
  const subscriberCode = (subscriber?.code ?? null) as string | null;

  // Fase 0 data capture: phone (for WhatsApp) and payment date (for finance).
  const buyerPhone = extractPhone(buyer);
  const buyerName = (buyer?.name as string | undefined) ?? null;
  const approvedDate = Number(purchase?.approved_date ?? data?.approved_date ?? 0) || 0;
  const lastPaymentAt = approvedDate ? new Date(approvedDate).toISOString() : new Date().toISOString();

  console.log(`Hotmart event: ${event} | status: ${purchaseStatus} | email: ${buyerEmail} | period: ${planPeriod} | next: ${dateNextCharge}`);

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

  // Abandoned checkout → store for sales recovery (no profile work needed).
  if (ABANDONED_EVENTS.has(effectiveEvent)) {
    await supabaseAdmin.from("abandoned_carts").insert({
      email: buyerEmail,
      name: buyerName,
      phone: buyerPhone,
      plan_name: (plan?.name as string) ?? null,
      hotmart_event: effectiveEvent,
    });
    console.log(`🛒 Abandoned cart stored: ${buyerEmail}`);
    return ok({ reason: "abandoned cart stored", email: buyerEmail });
  }

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
    // Buyer paid before having an account (direct purchase).
    if (PAUSED_EVENTS.has(effectiveEvent)) {
      // Cancellation/refund before signup → drop any pending purchase.
      await supabaseAdmin.from("pending_activations").delete().eq("email", buyerEmail);
      console.log(`No profile + paused event → pending cleared for ${buyerEmail}`);
      return ok({ reason: "no profile, pending removed" });
    }

    // Store the purchase as a pending activation (safety net + data store).
    await supabaseAdmin.from("pending_activations").upsert({
      email: buyerEmail,
      plan: "pro",
      plan_period: planPeriod,
      pro_ends_at: proEndsAt,
      plan_price: planPrice,
      plan_currency: planCurrency,
      hotmart_subscriber: subscriberCode,
      hotmart_transaction: transaction ?? null,
      phone: buyerPhone,
      last_payment_at: lastPaymentAt,
    });

    // Frictionless access: auto-create the account (Pro is granted by the
    // handle_new_user trigger reading the pending row), then send the "set your
    // password" email through Supabase Auth's recovery flow. We use Supabase Auth
    // (not Resend) here because it's the channel that reliably delivers and uses
    // the branded "reset password" template; clicking it fires PASSWORD_RECOVERY
    // in the app → the buyer sets a password once and logs in normally after.
    const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: buyerEmail,
      email_confirm: true,
    });
    if (createErr && !/already|registered|exists/i.test(createErr.message)) {
      console.error("Auto-provision failed:", createErr.message);
    }

    const { error: resetErr } = await supabaseAdmin.auth.resetPasswordForEmail(buyerEmail, {
      redirectTo: "https://app.edudraw.online/?reset_password=1",
    });
    if (resetErr) {
      console.error("resetPasswordForEmail failed:", resetErr.message);
    }

    await sendCapiEvent(buyerEmail, "Purchase", {
      value: planPrice ?? 64.9,
      currency: planCurrency ?? "USD",
    });

    console.log(`✅ Direct purchase provisioned + Supabase Auth recovery email sent: ${buyerEmail}`);
    return ok({ reason: "auto-provisioned", email: buyerEmail });
  }

  const userId = profiles[0].id as string;

  if (PAID_EVENTS.has(effectiveEvent)) {
    const proUpdate: Record<string, unknown> = {
      plan: "pro",
      trial_ends_at: null,
      pro_ends_at: proEndsAt,
      plan_period: planPeriod,
      plan_price: planPrice,
      plan_currency: planCurrency,
      hotmart_subscriber: subscriberCode,
      hotmart_transaction: transaction ?? null,
      last_payment_at: lastPaymentAt,
    };
    // Only overwrite phone if Hotmart actually sent one (don't wipe an existing value).
    if (buyerPhone) proUpdate.phone = buyerPhone;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(proUpdate)
      .eq("id", userId);

    if (error) {
      console.error("Failed to activate Pro:", error.message);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log(`✅ Pro activated for ${buyerEmail}`);

    // Mark any abandoned cart for this email as recovered (conversion tracking).
    await supabaseAdmin.from("abandoned_carts")
      .update({ recovered: true })
      .eq("email", buyerEmail)
      .eq("recovered", false);

    // CAPI Purchase event (use the real paid amount when available)
    await sendCapiEvent(buyerEmail, "Purchase", {
      value: planPrice ?? 64.9,
      currency: planCurrency ?? "USD",
    });

    const periodLabel = planPeriod === "annual" ? "anual" : planPeriod === "monthly" ? "mensual" : null;
    const renewLine = proEndsAt
      ? `Tu plan ${periodLabel ? `<strong>${periodLabel}</strong> ` : ""}se renueva automáticamente. Próxima renovación: <strong>${new Date(proEndsAt).toLocaleDateString("es-AR")}</strong>.`
      : "Ya tenés acceso completo a todas las funciones de EduDraw.";

    // Send payment confirmation email
    await sendEmail(
      buyerEmail,
      "¡Tu acceso Pro a EduDraw está activo! ⭐",
      emailLayout(`
        <h1 style="margin:0 0 12px;font-size:21px;font-weight:800;color:#1a1a2e;">¡Bienvenido/a al plan Pro! 🎉</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
          Tu pago fue procesado exitosamente. ${renewLine}
        </p>
        ${btnPrimary(SITE_URL, "Ir a mis dibujos →")}
        <table cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdf4;border-radius:10px;border-left:4px solid #22c55e;padding:16px 22px;margin-bottom:20px;">
          <tr><td>
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.8px;">Tu plan Pro incluye</p>
            <p style="margin:0 0 6px;font-size:14px;color:#166534;">✅ &nbsp;Dibujos y mapas mentales ilimitados</p>
            <p style="margin:0 0 6px;font-size:14px;color:#166534;">✅ &nbsp;Asistente de IA incluido</p>
            <p style="margin:0 0 6px;font-size:14px;color:#166534;">✅ &nbsp;Exportación HD</p>
            <p style="margin:0;font-size:14px;color:#166534;">✅ &nbsp;Soporte prioritario</p>
          </td></tr>
        </table>
        <p style="margin:0;font-size:13px;color:#aaa;">¿Tenés alguna pregunta? Respondé este email y te ayudamos.</p>
      `),
    );
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
