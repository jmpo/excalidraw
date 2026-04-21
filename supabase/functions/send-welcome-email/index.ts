import { sendEmail, emailLayout, btnPrimary, SITE_URL } from "../_shared/resend.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

  const record = (body.record ?? body) as Record<string, unknown>;
  const email = record.email as string | undefined;
  if (!email) return new Response(JSON.stringify({ ok: false, reason: "no email" }), { status: 200 });

  const result = await sendEmail(
    email,
    "¡Tu cuenta en EduDraw está lista! 🎉",
    emailLayout(`
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#1a1a2e;line-height:1.3;">¡Tu cuenta está lista! 🎉</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
        Bienvenido/a a EduDraw. Tu cuenta fue creada exitosamente y ya tenés <strong>7 días de acceso Pro gratuito</strong> para explorar todo lo que la plataforma tiene para ofrecer.
      </p>
      ${btnPrimary(SITE_URL, "Empezar a crear →")}
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8f7ff;border-radius:10px;padding:18px 22px;margin-bottom:22px;">
        <tr><td>
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#6128ff;text-transform:uppercase;letter-spacing:0.8px;">Tu prueba Pro incluye</p>
          <p style="margin:0 0 6px;font-size:14px;color:#333;">✅ &nbsp;7 días con acceso completo</p>
          <p style="margin:0 0 6px;font-size:14px;color:#333;">✅ &nbsp;Pizarras libres y mapas mentales</p>
          <p style="margin:0 0 6px;font-size:14px;color:#333;">✅ &nbsp;Asistente de IA incluido</p>
          <p style="margin:0;font-size:14px;color:#333;">✅ &nbsp;Sin tarjeta de crédito requerida</p>
        </td></tr>
      </table>
      <p style="margin:0;font-size:13px;color:#aaa;line-height:1.5;">Si no creaste esta cuenta podés ignorar este mensaje.</p>
    `),
  );

  return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
});
