import { getEffectivePlan } from "../../data/supabase";
import type { AdminProfile } from "../../data/supabase";
import { Card, Section, Metric, Badge, money, tokens } from "./ui";

// Hotmart keeps roughly this share of each sale (matches the observed ~11.1%).
const HOTMART_FEE = 0.111;

const monthlyEquivalent = (price: number, period: AdminProfile["plan_period"]): number =>
  period === "annual" ? price / 12 : price;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

export const FinanceTab = ({ profiles }: { profiles: AdminProfile[] }) => {
  // Active paying subscriptions (effective pro, with a real price).
  const activePaid = profiles.filter(
    (p) => getEffectivePlan(p) === "pro" && p.plan_price != null && p.plan_price > 0,
  );

  // MRR grouped by currency (so mixed currencies stay honest).
  const byCurrency: Record<string, { mrr: number; count: number }> = {};
  for (const p of activePaid) {
    const cur = p.plan_currency || "USD";
    const m = monthlyEquivalent(p.plan_price as number, p.plan_period);
    byCurrency[cur] = byCurrency[cur] || { mrr: 0, count: 0 };
    byCurrency[cur].mrr += m;
    byCurrency[cur].count += 1;
  }
  const currencies = Object.keys(byCurrency);
  const primaryCur = currencies.sort((a, b) => byCurrency[b].count - byCurrency[a].count)[0] || "USD";
  const mrr = byCurrency[primaryCur]?.mrr ?? 0;
  const arr = mrr * 12;
  const mrrNet = mrr * (1 - HOTMART_FEE);

  const monthlyCount = activePaid.filter((p) => p.plan_period === "monthly").length;
  const annualCount = activePaid.filter((p) => p.plan_period === "annual").length;

  // Upcoming renewals in the next 90 days (subscription pro with a due date).
  const now = Date.now();
  const horizon = now + 90 * 86400000;
  const renewals = activePaid
    .filter((p) => p.pro_ends_at && new Date(p.pro_ends_at).getTime() <= horizon && new Date(p.pro_ends_at).getTime() >= now)
    .sort((a, b) => new Date(a.pro_ends_at as string).getTime() - new Date(b.pro_ends_at as string).getTime());

  const renewalsGross = renewals.reduce((s, p) => s + (p.plan_price as number), 0);
  const renewalsNet = renewalsGross * (1 - HOTMART_FEE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Headline metrics */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Metric label="MRR (ingreso recurrente/mes)" value={money(mrr, primaryCur)} sub={`${activePaid.length} suscripciones activas`} accent={tokens.accent} />
        <Metric label="ARR (proyección anual)" value={money(arr, primaryCur)} sub="MRR × 12" accent="#7c3aed" />
        <Metric label="MRR neto (después de Hotmart)" value={money(mrrNet, primaryCur)} sub={`−${Math.round(HOTMART_FEE * 100)}% fee Hotmart`} accent="#059669" tone="neutral" />
        <Metric label="Próx. 90 días (renovaciones)" value={money(renewalsNet, primaryCur)} sub={`${renewals.length} renovaciones · neto`} accent="#2563eb" />
      </div>

      {currencies.length > 1 && (
        <Card style={{ padding: "12px 18px", background: "#fffbeb", border: "1px solid #fde68a" }}>
          <div style={{ fontSize: 12.5, color: "#92400e" }}>
            ⚠️ Hay suscripciones en varias monedas ({currencies.join(", ")}). Las métricas de arriba son de <strong>{primaryCur}</strong> (la más usada). El resto:{" "}
            {currencies.filter((c) => c !== primaryCur).map((c) => `${c}: ${money(byCurrency[c].mrr, c)}/mes`).join(" · ")}
          </div>
        </Card>
      )}

      {/* Plan mix */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Metric label="Plan Mensual" value={monthlyCount} sub="suscripciones activas" />
        <Metric label="Plan Anual" value={annualCount} sub="suscripciones activas" />
      </div>

      {/* Upcoming renewals */}
      <Section title="Próximas renovaciones" description="Suscripciones que vencen en los próximos 90 días (las mensuales renuevan solas cada mes)">
        {renewals.length === 0 ? (
          <div style={{ textAlign: "center", color: tokens.muted, padding: "24px 0", fontSize: 13 }}>
            No hay renovaciones en los próximos 90 días.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f0eeff" }}>
                {["Usuario", "Plan", "Vence", "Días", "Bruto", "Neto"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: tokens.muted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renewals.map((p) => {
                const days = Math.ceil((new Date(p.pro_ends_at as string).getTime() - now) / 86400000);
                const gross = p.plan_price as number;
                const cur = p.plan_currency || "USD";
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600, color: "#222" }}>{p.full_name || "—"}</div>
                      <div style={{ fontSize: 11, color: "#999" }}>{p.email}</div>
                    </td>
                    <td style={{ padding: "10px 12px" }}><Badge tone="accent">{p.plan_period === "annual" ? "Anual" : "Mensual"}</Badge></td>
                    <td style={{ padding: "10px 12px", color: "#555" }}>{fmtDate(p.pro_ends_at as string)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <Badge tone={days <= 7 ? "warning" : "muted"}>{days}d</Badge>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#555" }}>{money(gross, cur)}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#059669" }}>{money(gross * (1 - HOTMART_FEE), cur)}</td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: "2px solid #f0eeff" }}>
                <td colSpan={4} style={{ padding: "10px 12px", fontWeight: 700, color: "#222" }}>Total próximos 90 días</td>
                <td style={{ padding: "10px 12px", fontWeight: 700 }}>{money(renewalsGross, primaryCur)}</td>
                <td style={{ padding: "10px 12px", fontWeight: 800, color: "#059669" }}>{money(renewalsNet, primaryCur)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
};
