const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "EduDraw <hola@edudraw.chatea.click>";
const SITE_URL = "https://edudraw.chatea.click";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Called from DB webhook: payload.record has the new profile row
  const record = (body.record ?? body) as Record<string, unknown>;
  const email = record.email as string | undefined;

  if (!email) {
    return new Response(JSON.stringify({ ok: false, reason: "no email" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4ff;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(97,40,255,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(94deg,#4a0fcc,#6128ff);padding:32px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <svg viewBox="0 0 28 28" fill="none" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                      <rect width="28" height="28" rx="8" fill="white" fill-opacity="0.2"/>
                      <path d="M6 20L11 13L15 17L22 9" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">EduDraw</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#1a1a2e;line-height:1.3;">
                ¡Tu cuenta está lista! 🎉
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                Bienvenido/a a EduDraw. Tu cuenta fue creada exitosamente y ya tenés <strong>7 días de acceso Pro gratuito</strong> para explorar todo lo que la plataforma tiene para ofrecer.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:linear-gradient(94deg,#4a0fcc,#6128ff);border-radius:10px;">
                    <a href="${SITE_URL}"
                       style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                      Empezar a crear →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What's included -->
              <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8f7ff;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
                <tr><td style="padding-bottom:8px;">
                  <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#6128ff;text-transform:uppercase;letter-spacing:0.8px;">Tu prueba Pro incluye</p>
                </td></tr>
                <tr><td>
                  <p style="margin:0 0 7px;font-size:14px;color:#333;">✅ &nbsp;7 días con acceso completo</p>
                  <p style="margin:0 0 7px;font-size:14px;color:#333;">✅ &nbsp;Pizarras libres y mapas mentales</p>
                  <p style="margin:0 0 7px;font-size:14px;color:#333;">✅ &nbsp;Asistente de IA incluido</p>
                  <p style="margin:0;font-size:14px;color:#333;">✅ &nbsp;Sin tarjeta de crédito requerida</p>
                </td></tr>
              </table>

              <p style="margin:0;font-size:13px;color:#aaa;line-height:1.5;">
                Si no creaste esta cuenta podés ignorar este mensaje.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #f0eeff;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#bbb;">
                © 2026 EduDraw · <a href="${SITE_URL}" style="color:#6128ff;text-decoration:none;">edudraw.chatea.click</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [email],
      subject: "¡Tu cuenta en EduDraw está lista! 🎉",
      html,
    }),
  });

  const result = await res.json();
  console.log(`Welcome email to ${email}:`, res.status, JSON.stringify(result));

  return new Response(JSON.stringify({ ok: res.ok, ...result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
