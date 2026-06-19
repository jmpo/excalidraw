import { createClient } from "npm:@supabase/supabase-js@2";

// Receives Resend email events and updates email_log.status by resend_id.
// Configure in Resend → Webhooks, pointing to this function URL.

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Optional Svix signature verification (set RESEND_WEBHOOK_SECRET = whsec_...).
const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET");

const b64decode = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64encode = (b: Uint8Array) => btoa(String.fromCharCode(...b));

async function verifySvix(headers: Headers, payload: string): Promise<boolean> {
  if (!WEBHOOK_SECRET) return true; // verification disabled
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sigHeader = headers.get("svix-signature");
  if (!id || !ts || !sigHeader) return false;
  const secretBytes = b64decode(WEBHOOK_SECRET.replace(/^whsec_/, ""));
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${payload}`));
  const expected = b64encode(new Uint8Array(sig));
  const passed = sigHeader.split(" ").map((s) => s.split(",")[1]);
  return passed.includes(expected);
}

// Map Resend event → our status, with a rank so a later 'delivered' never
// downgrades an earlier 'opened'. Negative statuses always apply.
const STATUS: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delayed",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
};
const RANK: Record<string, number> = { sent: 1, delayed: 1, delivered: 2, opened: 3, clicked: 4 };
const NEGATIVE = new Set(["bounced", "complained"]);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const raw = await req.text();
  if (!(await verifySvix(req.headers, raw))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let body: { type?: string; data?: { email_id?: string } };
  try { body = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }

  const newStatus = STATUS[body.type ?? ""];
  const emailId = body.data?.email_id;
  if (!newStatus || !emailId) {
    return new Response(JSON.stringify({ ok: true, ignored: body.type }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  const { data: rows } = await sb.from("email_log").select("id, status").eq("resend_id", emailId).limit(1);
  if (rows && rows.length > 0) {
    const cur = rows[0].status as string;
    const upgrade = NEGATIVE.has(newStatus) || (RANK[newStatus] ?? 0) > (RANK[cur] ?? 0);
    if (upgrade) {
      await sb.from("email_log").update({ status: newStatus }).eq("id", rows[0].id);
    }
  }

  return new Response(JSON.stringify({ ok: true, status: newStatus }), { status: 200, headers: { "Content-Type": "application/json" } });
});
