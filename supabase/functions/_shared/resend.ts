const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
export const FROM_EMAIL = "EduDraw <hola@edudraw.chatea.click>";
export const SITE_URL = "https://edudraw.chatea.click";
export const HOTMART_URL = "https://pay.hotmart.com/E105478979P";

export const sendEmail = async (to: string, subject: string, html: string) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  const result = await res.json();
  console.log(`Email to ${to} [${subject}]:`, res.status, JSON.stringify(result));
  return { ok: res.ok, ...result };
};

// ── Shared HTML layout ────────────────────────────────────────────────────────

export const emailLayout = (content: string) => `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f5f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4ff;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(97,40,255,0.10);">
        <tr>
          <td style="background:linear-gradient(94deg,#4a0fcc,#6128ff);padding:28px 40px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
              <td style="vertical-align:middle;padding-right:10px;">
                <svg viewBox="0 0 28 28" fill="none" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                  <rect width="28" height="28" rx="8" fill="white" fill-opacity="0.2"/>
                  <path d="M6 20L11 13L15 17L22 9" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </td>
              <td style="vertical-align:middle;">
                <span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px;">EduDraw</span>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr><td style="padding:36px 40px 28px;">${content}</td></tr>
        <tr>
          <td style="background:#fafafa;border-top:1px solid #f0eeff;padding:18px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#bbb;">© 2026 EduDraw · <a href="${SITE_URL}" style="color:#6128ff;text-decoration:none;">edudraw.chatea.click</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

export const btnPrimary = (href: string, label: string) =>
  `<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr><td style="background:linear-gradient(94deg,#4a0fcc,#6128ff);border-radius:10px;">
      <a href="${href}" style="display:inline-block;padding:13px 32px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">${label}</a>
    </td></tr>
  </table>`;
