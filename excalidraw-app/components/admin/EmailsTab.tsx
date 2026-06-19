import { useEffect, useState } from "react";
import { fetchEmailLog } from "../../data/supabase";
import type { EmailLogRow } from "../../data/supabase";
import { Section, Badge, Button, tokens } from "./ui";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const statusTone = (s: string): "success" | "danger" | "warning" | "muted" | "accent" => {
  if (s === "opened" || s === "clicked") return "accent";
  if (s === "delivered" || s === "sent") return "success";
  if (s === "failed" || s === "bounced" || s === "complained") return "danger";
  if (s === "delayed") return "warning";
  return "muted";
};

const statusLabel: Record<string, string> = {
  sent: "Enviado", delivered: "Entregado", opened: "Abierto", clicked: "Click",
  bounced: "Rebotó", complained: "Spam", delayed: "Demorado", failed: "Falló",
};

export const EmailsTab = () => {
  const [rows, setRows] = useState<EmailLogRow[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await fetchEmailLog(100));
    } catch {
      setError("No se pudo cargar el historial de emails.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = (rows ?? []).filter(
    (r) => !q || r.recipient.toLowerCase().includes(q.toLowerCase()) || (r.subject ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <Section
      title="Emails enviados"
      description="Historial de correos enviados vía Resend (últimos 100)."
      right={
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Buscar por email o asunto…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: 9, border: tokens.border, fontSize: 13, fontFamily: tokens.font, outline: "none", minWidth: 220 }}
          />
          <Button variant="outline" onClick={load} disabled={loading}>{loading ? "…" : "↻ Actualizar"}</Button>
        </div>
      }
    >
      {error && <div style={{ color: "#dc2626", fontSize: 13, padding: "8px 0" }}>{error}</div>}
      {rows === null ? (
        <div style={{ textAlign: "center", color: tokens.muted, padding: "30px 0" }}>Cargando…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: tokens.muted, padding: "30px 0", fontSize: 13 }}>
          {rows.length === 0 ? "Todavía no se registraron emails. Aparecerán a medida que el sistema los envíe." : "Sin resultados para la búsqueda."}
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f0eeff" }}>
              {["Destinatario", "Asunto", "Estado", "Enviado"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: tokens.muted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                <td style={{ padding: "10px 12px", color: "#333" }}>{r.recipient}</td>
                <td style={{ padding: "10px 12px", color: "#555", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.subject || "—"}</td>
                <td style={{ padding: "10px 12px" }}><Badge tone={statusTone(r.status)}>{statusLabel[r.status] ?? r.status}</Badge></td>
                <td style={{ padding: "10px 12px", color: "#888" }}>{fmt(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
};
