// Called daily by pg_cron — sends a warning email to users whose trial
// expires tomorrow and a "trial ended" email to users who expired today.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail, emailLayout, btnPrimary, SITE_URL, HOTMART_URL } from "../_shared/resend.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const now = new Date();
  const tomorrowStart = new Date(now); tomorrowStart.setDate(tomorrowStart.getDate() + 1); tomorrowStart.setHours(0,0,0,0);
  const tomorrowEnd   = new Date(tomorrowStart); tomorrowEnd.setHours(23,59,59,999);
  const todayStart    = new Date(now); todayStart.setHours(0,0,0,0);
  const todayEnd      = new Date(now); todayEnd.setHours(23,59,59,999);

  // Users whose trial expires TOMORROW → send warning
  const { data: expiringSoon } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("plan", "trial")
    .gte("trial_ends_at", tomorrowStart.toISOString())
    .lte("trial_ends_at", tomorrowEnd.toISOString());

  // Users whose trial expired TODAY → send "ended" email
  const { data: justExpired } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("plan", "trial")
    .gte("trial_ends_at", todayStart.toISOString())
    .lte("trial_ends_at", todayEnd.toISOString());

  let sent = 0;

  for (const profile of expiringSoon ?? []) {
    await sendEmail(
      profile.email,
      "Tu prueba de EduDraw termina mañana ⏰",
      emailLayout(`
        <h1 style="margin:0 0 12px;font-size:21px;font-weight:800;color:#1a1a2e;">Tu acceso Pro termina mañana</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
          Mañana finaliza tu período de prueba gratuita en EduDraw. Para seguir creando sin límites, pasate al plan Pro hoy.
        </p>
        ${btnPrimary(HOTMART_URL, "Quiero el plan Pro →")}
        <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8f7ff;border-radius:10px;padding:18px 22px;margin-bottom:20px;">
          <tr><td>
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#6128ff;text-transform:uppercase;letter-spacing:0.8px;">Plan Pro incluye</p>
            <p style="margin:0 0 6px;font-size:14px;color:#333;">✅ &nbsp;Dibujos ilimitados</p>
            <p style="margin:0 0 6px;font-size:14px;color:#333;">✅ &nbsp;Mapas mentales ilimitados</p>
            <p style="margin:0 0 6px;font-size:14px;color:#333;">✅ &nbsp;Asistente de IA</p>
            <p style="margin:0;font-size:14px;color:#333;">✅ &nbsp;Acceso permanente sin preocupaciones</p>
          </td></tr>
        </table>
        <p style="margin:0;font-size:13px;color:#aaa;line-height:1.5;">Si decidís no continuar, tu cuenta se mantendrá activa con acceso gratuito (hasta 2 dibujos).</p>
      `),
    );
    sent++;
  }

  for (const profile of justExpired ?? []) {
    await sendEmail(
      profile.email,
      "Tu prueba de EduDraw terminó — seguí creando con Pro",
      emailLayout(`
        <h1 style="margin:0 0 12px;font-size:21px;font-weight:800;color:#1a1a2e;">Tu período de prueba terminó</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
          Esperamos que hayas disfrutado los 7 días de acceso completo a EduDraw. Tu cuenta sigue activa con el plan gratuito (hasta 2 dibujos). Para recuperar el acceso completo, pasate a Pro.
        </p>
        ${btnPrimary(HOTMART_URL, "Reactivar acceso Pro →")}
        <table cellpadding="0" cellspacing="0" width="100%" style="background:#fff8f0;border-radius:10px;border-left:4px solid #f59e0b;padding:16px 20px;margin-bottom:20px;">
          <tr><td>
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400e;">Tus dibujos están guardados</p>
            <p style="margin:0;font-size:13px;color:#78350f;line-height:1.5;">No perdés nada — todos tus trabajos quedan guardados. Solo necesitás activar Pro para editarlos nuevamente.</p>
          </td></tr>
        </table>
        <p style="margin:0;font-size:13px;color:#aaa;">¿Tenés alguna pregunta? Respondé este email y te ayudamos.</p>
      `),
    );
    sent++;
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
