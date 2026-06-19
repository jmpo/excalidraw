import { useState } from "react";
import { getEffectivePlan } from "../../data/supabase";
import type { AdminProfile } from "../../data/supabase";
import { Section, Metric, Badge, Button, tokens } from "./ui";

type Filter = "all" | "pro" | "trial" | "free" | "paused";

const csvEscape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;

const downloadCsv = (rows: AdminProfile[]) => {
  const header = ["nombre", "email", "telefono", "plan", "periodo", "vence", "ultimo_pago"];
  const lines = rows.map((p) =>
    [
      p.full_name ?? "",
      p.email,
      p.phone ?? "",
      getEffectivePlan(p),
      p.plan_period ?? "",
      p.pro_ends_at ? new Date(p.pro_ends_at).toLocaleDateString("es-AR") : "",
      p.last_payment_at ? new Date(p.last_payment_at).toLocaleDateString("es-AR") : "",
    ].map((x) => csvEscape(String(x))).join(","),
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contactos-edudraw-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const WhatsappTab = ({ profiles }: { profiles: AdminProfile[] }) => {
  const [filter, setFilter] = useState<Filter>("all");

  const withPhone = profiles.filter((p) => p.phone && p.phone.trim());
  const list = filter === "all" ? withPhone : withPhone.filter((p) => getEffectivePlan(p) === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Metric label="Contactos con teléfono" value={withPhone.length} sub={`de ${profiles.length} usuarios`} accent={tokens.accent} />
        <Metric label="En este filtro" value={list.length} sub={filter === "all" ? "todos" : filter} accent="#16a34a" />
      </div>

      <Section
        title="Exportar contactos para WhatsApp"
        description="Descargá la lista (CSV) para enviar mensajes masivos. Solo incluye usuarios con teléfono cargado (capturado en el checkout de Hotmart)."
        right={
          <Button onClick={() => downloadCsv(list)} disabled={list.length === 0}>⬇ Exportar CSV ({list.length})</Button>
        }
      >
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {(["all", "pro", "trial", "free", "paused"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "5px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: filter === f ? tokens.accent : tokens.accentSoft, color: filter === f ? "#fff" : tokens.accent }}>
              {f === "all" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div style={{ textAlign: "center", color: tokens.muted, padding: "30px 0", fontSize: 13 }}>
            No hay contactos con teléfono en este filtro. Los números se capturan en las compras nuevas (con el campo Teléfono activo en el checkout de Hotmart).
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f0eeff" }}>
                {["Nombre", "Email", "Teléfono", "Plan"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: tokens.muted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <td style={{ padding: "10px 12px", color: "#333", fontWeight: 600 }}>{p.full_name || "—"}</td>
                  <td style={{ padding: "10px 12px", color: "#666", fontSize: 12 }}>{p.email}</td>
                  <td style={{ padding: "10px 12px", color: "#333", fontFamily: "monospace" }}>{p.phone}</td>
                  <td style={{ padding: "10px 12px" }}><Badge tone={getEffectivePlan(p) === "pro" ? "success" : "muted"}>{getEffectivePlan(p)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
};
