// Called daily by pg_cron — sends a reactivation nudge to users who have
// been in 'paused' state for exactly 3 days.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail, emailLayout, btnPrimary, HOTMART_URL } from "../_shared/resend.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
  const windowStart  = new Date(threeDaysAgo); windowStart.setHours(0, 0, 0, 0);
  const windowEnd    = new Date(threeDaysAgo); windowEnd.setHours(23, 59, 59, 999);

  // Users paused exactly ~3 days ago (using updated_at as proxy)
  const { data: paused } = await supabaseAdmin
    .from("profiles")
    .select("email, full_name")
    .eq("plan", "paused")
    .gte("updated_at", windowStart.toISOString())
    .lte("updated_at", windowEnd.toISOString());

  let sent = 0;

  for (const profile of paused ?? []) {
    const name = profile.full_name ? profile.full_name.split(" ")[0] : "hola";

    await sendEmail(
      profile.email,
      "¿Tuviste algún problema con tu pago? Te ayudamos 🤝",
      emailLayout(`
        <h1 style="margin:0 0 12px;font-size:21px;font-weight:800;color:#1a1a2e;line-height:1.3;">
          ${name}, ¿todo bien con tu acceso?
        </h1>
        <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
          Notamos que tu cuenta en EduDraw está pausada hace unos días. Si tuviste algún problema con el pago o simplemente querés retomar, estamos para ayudarte.
        </p>
        ${btnPrimary(HOTMART_URL, "Reactivar mi acceso →")}
        <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8f7ff;border-radius:10px;padding:18px 22px;margin-bottom:22px;">
          <tr><td>
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#6128ff;">Tus dibujos siguen guardados</p>
            <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">
              No perdés nada. Todos tus trabajos están seguros y vas a poder acceder a ellos apenas reactives tu plan Pro.
            </p>
          </td></tr>
        </table>
        <table cellpadding="0" cellspacing="0" width="100%" style="background:#fff8f0;border-radius:10px;border-left:4px solid #f59e0b;padding:16px 20px;margin-bottom:22px;">
          <tr><td>
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400e;">¿Problema técnico?</p>
            <p style="margin:0;font-size:13px;color:#78350f;line-height:1.5;">
              Respondé este email y te ayudamos a resolverlo. Nuestro equipo responde en menos de 24hs.
            </p>
          </td></tr>
        </table>
        <p style="margin:0;font-size:13px;color:#aaa;line-height:1.5;">
          Si decidiste no continuar, no hay problema — tu cuenta permanece activa con acceso gratuito.
        </p>
      `),
    );
    sent++;
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
