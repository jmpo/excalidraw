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

  const buyerEmail = buyer?.email as string | undefined;
  const transaction = (purchase?.transaction ?? purchase?.order_string) as string | undefined;
  const purchaseStatus = purchase?.status as string | undefined;

  // ── Subscription details (period / price / next charge) ──────────────────────
  const subscription = data?.subscription as Record<string, unknown> | undefined;
  const plan = subscription?.plan as Record<string, unknown> | undefined;
  const subscriber = subscription?.subscriber as Record<string, unknown> | undefined;
  const price = purchase?.price as Record<string, unknown> | undefined;

  const planName = String(plan?.name ?? "").toLowerCase();
  // date_next_charge comes as epoch milliseconds; it's the natural expiry anchor
  const dateNextCharge = Number(purchase?.date_next_charge ?? 0) || 0;

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

  const planPrice = price?.value != null ? Number(price.value) : null;
  const planCurrency = (price?.currency_value ?? price?.currency_code ?? null) as string | null;
  const subscriberCode = (subscriber?.code ?? null) as string | null;

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
    });

    // Frictionless access: auto-create the account (Pro is granted by the
    // handle_new_user trigger reading the pending row) and email a "set your
    // password" link. Clicking it fires PASSWORD_RECOVERY in the app → the buyer
    // sets a password once and can log in normally from then on.
    const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: buyerEmail,
      email_confirm: true,
    });
    if (createErr && !/already|registered|exists/i.test(createErr.message)) {
      console.error("Auto-provision failed:", createErr.message);
    }

    let loginLink = "https://app.edudraw.online";
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: buyerEmail,
      options: { redirectTo: "https://app.edudraw.online/?reset_password=1" },
    });
    if (linkErr) {
      console.warn("generateLink failed:", linkErr.message);
    } else if (linkData?.properties?.action_link) {
      loginLink = linkData.properties.action_link;
    }

    await sendCapiEvent(buyerEmail, "Purchase", {
      value: planPrice ?? 64.9,
      currency: planCurrency ?? "USD",
    });

    await sendEmail(
      buyerEmail,
      "¡Tu acceso Pro a EduDraw está listo! ⭐ Creá tu contraseña",
      emailLayout(`
        <h1 style="margin:0 0 12px;font-size:21px;font-weight:800;color:#1a1a2e;">¡Gracias por tu compra! 🎉</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
          Ya creamos tu cuenta Pro. Hacé click para <strong>definir tu contraseña</strong> y entrar.
          Con ella vas a poder ingresar siempre que quieras.
        </p>
        ${btnPrimary(loginLink, "Crear contraseña y entrar →")}
        <p style="margin:0 0 16px;font-size:13px;color:#888;line-height:1.6;">
          Tu cuenta está asociada al email <strong>${buyerEmail}</strong>. Usá siempre ese email y tu contraseña para ingresar en <a href="https://app.edudraw.online" style="color:#6128ff;text-decoration:none;">app.edudraw.online</a>.
        </p>
        <table cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdf4;border-radius:10px;border-left:4px solid #22c55e;padding:16px 22px;margin-bottom:20px;">
          <tr><td>
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.8px;">Tu plan Pro incluye</p>
            <p style="margin:0 0 6px;font-size:14px;color:#166534;">✅ &nbsp;Dibujos y mapas mentales ilimitados</p>
            <p style="margin:0 0 6px;font-size:14px;color:#166534;">✅ &nbsp;Asistente de IA incluido</p>
            <p style="margin:0;font-size:14px;color:#166534;">✅ &nbsp;Exportación HD</p>
          </td></tr>
        </table>
        <p style="margin:0;font-size:13px;color:#aaa;">¿Algún problema para entrar? Respondé este email y te ayudamos.</p>
      `),
    );

    console.log(`✅ Direct purchase provisioned + magic link sent: ${buyerEmail}`);
    return ok({ reason: "auto-provisioned", email: buyerEmail });
  }

  const userId = profiles[0].id as string;

  if (PAID_EVENTS.has(effectiveEvent)) {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        plan: "pro",
        trial_ends_at: null,
        pro_ends_at: proEndsAt,
        plan_period: planPeriod,
        plan_price: planPrice,
        plan_currency: planCurrency,
        hotmart_subscriber: subscriberCode,
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
