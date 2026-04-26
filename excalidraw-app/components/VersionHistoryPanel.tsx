import { useEffect, useState } from "react";
import { getVersions, getVersionSnapshot, deleteVersion, saveVersion } from "../data/supabase";
import type { DrawingVersion } from "../data/supabase";

interface Props {
  drawingId: string;
  drawingName: string;
  onClose: () => void;
  onRestore: (content: Record<string, unknown>) => void;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

export const VersionHistoryPanel = ({ drawingId, drawingName, onClose, onRestore }: Props) => {
  const [versions, setVersions] = useState<DrawingVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getVersions(drawingId)
      .then(setVersions)
      .finally(() => setLoading(false));
  }, [drawingId]);

  const handleRestore = async (versionId: string) => {
    if (!confirm("¿Restaurar esta versión? El estado actual será reemplazado.")) return;
    setRestoring(versionId);
    try {
      const snapshot = await getVersionSnapshot(versionId);
      if (!snapshot) { alert("No se pudo cargar la versión."); return; }
      onRestore(snapshot);
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteVersion(versionId);
    setVersions((prev) => prev.filter((v) => v.id !== versionId));
  };

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveNow = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const { supabase } = await import("../data/supabase");
      const { data, error } = await supabase
        .from("drawings")
        .select("content")
        .eq("id", drawingId)
        .single();
      if (error) throw new Error(error.message);
      // Allow saving even if content is null/empty (snapshot will be {})
      const snapshot = (data?.content ?? {}) as Record<string, unknown>;
      await saveVersion(drawingId, snapshot, labelInput.trim() || undefined);
      setLabelInput("");
      const updated = await getVersions(drawingId);
      setVersions(updated);
    } catch (err: any) {
      setSaveError(err?.message ?? "Error al guardar la versión.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(10,5,30,0.45)",
        zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Assistant, system-ui, sans-serif",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 20, width: 500, maxWidth: "95vw",
        maxHeight: "85vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a2e" }}>🕐 Historial de versiones</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{drawingName}</div>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 22, lineHeight: 1, padding: "2px 4px" }}>×</button>
        </div>

        {/* Save snapshot now */}
        <div style={{ padding: "14px 24px 0", display: "flex", gap: 8 }}>
          <input
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Nombre opcional (ej: Antes de cambiar layout)"
            style={{
              flex: 1, padding: "8px 12px", fontSize: 13,
              border: "1.5px solid #e0deff", borderRadius: 8, outline: "none", fontFamily: "inherit",
            }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveNow(); }}
          />
          <button
            onClick={handleSaveNow}
            disabled={saving}
            style={{
              padding: "8px 16px", background: saving ? "#ccc" : "#6965db", border: "none",
              borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer", flexShrink: 0,
            }}
          >
            {saving ? "Guardando…" : "💾 Guardar ahora"}
          </button>
        </div>
        {saveError ? (
          <div style={{ padding: "4px 24px 0", fontSize: 11, color: "#ef4444" }}>
            ⚠ {saveError}
          </div>
        ) : (
          <div style={{ padding: "4px 24px 0", fontSize: 11, color: "#bbb" }}>
            Guarda el estado actual como una versión restaurable · Máximo 10 versiones guardadas
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: "#f0efff", margin: "14px 0 0" }} />

        {/* Versions list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 32, color: "#bbb", fontSize: 13 }}>Cargando…</div>
          ) : versions.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
              <div style={{ fontSize: 13, color: "#888" }}>Sin versiones guardadas todavía.</div>
              <div style={{ fontSize: 12, color: "#bbb", marginTop: 6 }}>
                Guardá la primera versión usando el botón de arriba.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
              {versions.map((v, i) => (
                <div key={v.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 10,
                  background: i === 0 ? "#f8f7ff" : "#fafafa",
                  border: `1.5px solid ${i === 0 ? "#e0deff" : "#f0f0f0"}`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {v.label ?? `Versión ${versions.length - i}`}
                      {i === 0 && (
                        <span style={{ marginLeft: 8, fontSize: 10, background: "#6965db",
                          color: "#fff", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>
                          más reciente
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{fmtDate(v.created_at)}</div>
                  </div>
                  <button
                    onClick={() => handleRestore(v.id)}
                    disabled={restoring === v.id}
                    style={{
                      padding: "5px 12px", background: restoring === v.id ? "#ccc" : "#f0efff",
                      border: "1px solid #c8c6f0", borderRadius: 7,
                      fontSize: 12, fontWeight: 600, color: "#6965db",
                      cursor: restoring === v.id ? "not-allowed" : "pointer", flexShrink: 0,
                    }}
                  >
                    {restoring === v.id ? "…" : "Restaurar"}
                  </button>
                  <button
                    onClick={(e) => handleDelete(v.id, e)}
                    title="Eliminar esta versión"
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#ccc", fontSize: 16, lineHeight: 1, padding: "2px 4px",
                    }}
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
