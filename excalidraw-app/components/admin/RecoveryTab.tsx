import { useEffect, useState } from "react";
import { fetchAbandonedCarts } from "../../data/supabase";
import type { AbandonedCart } from "../../data/supabase";
import { Section, Metric, Badge, Button, tokens } from "./ui";

const HOTMART_URL = (import.meta.env.VITE_HOTMART_PRO_URL as string) || "https://app.edudraw.online";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const waLink = (cart: AbandonedCart) => {
  const name = cart.name?.split(" ")[0] || "";
  const msg = `Hola ${name}! 👋 Vi que te interesó EduDraw Pro pero no llegaste a completar la compra. ¿Te ayudo con algo? Acá tenés el link para terminar: ${HOTMART_URL}`;
  return `https://wa.me/${(cart.phone ?? "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`;
};

export const RecoveryTab = () => {
  const [rows, setRows] = useState<AbandonedCart[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await fetchAbandonedCarts(200));
    } catch {
      setError("No se pudo cargar la recuperación de ventas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const total = rows?.length ?? 0;
  const recovered = (rows ?? []).filter((r) => r.recovered).length;
  const pending = total - recovered;
  const rate = total > 0 ? Math.round((recovered / total) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Metric label="Carritos abandonados" value={total} sub="total registrados" accent={tokens.accent} />
        <Metric label="Recuperados" value={recovered} sub="completaron la compra" accent="#059669" tone="up" />
        <Metric label="Pendientes" value={pending} sub="oportunidad de venta" accent="#d97706" />
        <Metric label="Tasa de conversión" value={`${rate}%`} sub="recuperados / total" accent="#2563eb" />
      </div>

      <Section
        title="Recuperación de ventas"
        description="Personas que abandonaron el checkout de Hotmart. Escribiles por WhatsApp para cerrar la venta."
        right={<Button variant="outline" onClick={load} disabled={loading}>{loading ? "…" : "↻ Actualizar"}</Button>}
      >
        {error && <div style={{ color: "#dc2626", fontSize: 13, padding: "8px 0" }}>{error}</div>}
        {rows === null ? (
          <div style={{ textAlign: "center", color: tokens.muted, padding: "30px 0" }}>Cargando…</div>
        ) : total === 0 ? (
          <div style={{ textAlign: "center", color: tokens.muted, padding: "30px 0", fontSize: 13 }}>
            No hay carritos abandonados todavía. Aparecerán cuando alguien abandone el checkout (evento "Abandono de carrito" activo en Hotmart).
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f0eeff" }}>
                {["Contacto", "Plan", "Teléfono", "Fecha", "Estado", "Acción"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: tokens.muted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 600, color: "#222" }}>{c.name || "—"}</div>
                    <div style={{ fontSize: 11, color: "#999" }}>{c.email || "—"}</div>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#555" }}>{c.plan_name || "—"}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#333" }}>{c.phone || "—"}</td>
                  <td style={{ padding: "10px 12px", color: "#888" }}>{fmt(c.created_at)}</td>
                  <td style={{ padding: "10px 12px" }}>
                    {c.recovered ? <Badge tone="success">Recuperado</Badge> : <Badge tone="warning">Pendiente</Badge>}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {c.phone && !c.recovered ? (
                      <a href={waLink(c)} target="_blank" rel="noreferrer"
                        style={{ textDecoration: "none", display: "inline-block", padding: "6px 12px", borderRadius: 8, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700 }}>
                        💬 WhatsApp
                      </a>
                    ) : (
                      <span style={{ color: "#bbb", fontSize: 12 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
};
