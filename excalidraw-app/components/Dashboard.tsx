import { useEffect, useState } from "react";

import {
  fetchDrawings,
  fetchFolders,
  createDrawing,
  createFolder,
  deleteDrawing,
  deleteFolder,
  renameDrawing,
  renameFolder,
  saveDrawing,
  moveDrawingToFolder,
  signOut,
  getEffectivePlan,
  isTrialActive,
  trialDaysLeft,
  getHotmartCheckoutUrl,
  DrawingLimitError,
  isPaused,
} from "../data/supabase";
import { useAuth } from "../auth/AuthContext";
import { TEMPLATES } from "../data/templates";

import "./Dashboard.scss";

import type { Drawing, DrawingType, Folder, Profile } from "../data/supabase";
import type { Template } from "../data/templates";

// ─── Type picker (Canvas vs Mind Map) ─────────────────────────────────────────

const TypePicker = ({
  onSelect,
  onCancel,
}: {
  onSelect: (type: DrawingType) => void;
  onCancel: () => void;
}) => {
  const [hovered, setHovered] = useState<DrawingType | null>(null);

  const options: { type: DrawingType; icon: string; label: string; desc: string }[] = [
    {
      type: "canvas",
      icon: "🎨",
      label: "Pizarra libre",
      desc: "Dibujo libre, formas, flechas y notas",
    },
    {
      type: "mindmap",
      icon: "🧠",
      label: "Mapa mental",
      desc: "Organizar ideas en nodos y ramas",
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "28px 32px",
          width: 460,
          maxWidth: "95vw",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 6px", fontSize: 20, color: "#222" }}>
          ¿Qué querés crear?
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#888" }}>
          Elegí el tipo de documento
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {options.map((opt) => (
            <div
              key={opt.type}
              onClick={() => onSelect(opt.type)}
              onMouseEnter={() => setHovered(opt.type)}
              onMouseLeave={() => setHovered(null)}
              style={{
                border: `2px solid ${hovered === opt.type ? "#6965db" : "#e0e0e0"}`,
                borderRadius: 12,
                padding: "22px 16px",
                cursor: "pointer",
                textAlign: "center",
                background: hovered === opt.type ? "#f5f4ff" : "#fafafa",
                transition: "border-color 0.12s, background 0.12s",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 10 }}>{opt.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#333", marginBottom: 6 }}>
                {opt.label}
              </div>
              <div style={{ fontSize: 12, color: "#888", lineHeight: 1.4 }}>
                {opt.desc}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onCancel}
          style={{
            marginTop: 20,
            float: "right",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#aaa",
            fontSize: 13,
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

// ─── Template picker ──────────────────────────────────────────────────────────

const TemplatePicker = ({
  onSelect,
  onCancel,
}: {
  onSelect: (t: Template) => void;
  onCancel: () => void;
}) => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "28px 32px",
          width: 580,
          maxWidth: "95vw",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 6px", fontSize: 20, color: "#222" }}>
          Nuevo dibujo
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#888" }}>
          Elegí una plantilla para empezar
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelect(t)}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                border: `2px solid ${hovered === t.id ? "#6965db" : "#e0e0e0"}`,
                borderRadius: 10,
                padding: "16px 12px",
                cursor: "pointer",
                textAlign: "center",
                background: hovered === t.id ? "#f5f4ff" : "#fafafa",
                transition: "border-color 0.12s, background 0.12s",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{t.icon}</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#333",
                  marginBottom: 4,
                }}
              >
                {t.name}
              </div>
              <div style={{ fontSize: 11, color: "#888", lineHeight: 1.4 }}>
                {t.description}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onCancel}
          style={{
            marginTop: 20,
            float: "right",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#aaa",
            fontSize: 13,
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

const FREE_DRAWING_LIMIT = 2;
const TRIAL_DRAWING_LIMIT = 5;

// ─── Upgrade modal ────────────────────────────────────────────────────────────

const UpgradeModal = ({
  onClose,
  currentPlan = "free",
}: {
  onClose: () => void;
  currentPlan?: string;
}) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    onClick={onClose}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "36px 40px",
        width: 460,
        maxWidth: "95vw",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        textAlign: "center",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
      <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#222" }}>
        {currentPlan === "trial" ? "Límite del período de prueba" : "Límite del plan gratuito"}
      </h2>
      <p style={{ margin: "0 0 8px", fontSize: 15, color: "#555", lineHeight: 1.5 }}>
        {currentPlan === "trial" ? (
          <>El trial incluye hasta <strong>{TRIAL_DRAWING_LIMIT} dibujos</strong>.</>
        ) : (
          <>El plan gratuito incluye hasta <strong>{FREE_DRAWING_LIMIT} dibujos</strong>.</>
        )}
        {" "}Pasate a Pro para tener dibujos ilimitados.
      </p>

      <div style={{ textAlign: "left", margin: "16px 0 20px", padding: "16px 20px", background: "#f8f7ff", borderRadius: 10 }}>
        {[
          "✅ Dibujos ilimitados",
          "✅ Carpetas ilimitadas",
          "✅ Exportación HD",
          "✅ Soporte prioritario",
        ].map((f) => (
          <div key={f} style={{ fontSize: 13, color: "#444", marginBottom: 5, fontWeight: 500 }}>{f}</div>
        ))}
      </div>

      <a
        href={getHotmartCheckoutUrl()}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          padding: "13px 32px",
          background: "linear-gradient(94deg, #4a0fcc, #6128ff)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          width: "100%",
          marginBottom: 8,
          textDecoration: "none",
          boxSizing: "border-box",
        }}
      >
        Obtener Pro →
      </a>
      <button
        onClick={onClose}
        style={{ padding: "8px", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 13 }}
      >
        Ahora no
      </button>
    </div>
  </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const Dashboard = ({
  onOpenDrawing,
  onOpenAdmin,
  profile,
  onProfileChange,
}: {
  onOpenDrawing: (id: string) => void;
  onOpenAdmin?: () => void;
  profile?: Profile | null;
  onProfileChange?: (p: Profile) => void;
}) => {
  const { user } = useAuth();
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null | "all">(
    "all",
  );
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState("");
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [movingDrawingId, setMovingDrawingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const load = async (isFirstLoad = false) => {
    setLoading(true);
    try {
      const [d, f] = await Promise.all([fetchDrawings(), fetchFolders()]);
      setDrawings(d);
      setFolders(f);
      // Onboarding: auto-create first drawing for brand-new users
      if (isFirstLoad && d.length === 0) {
        const drawing = await createDrawing("Mi primer dibujo");
        onOpenDrawing(drawing.id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
  }, []);

  const effectivePlan = profile ? getEffectivePlan(profile) : "free";
  const trialOn = profile ? isTrialActive(profile) : false;
  const daysLeft = profile ? trialDaysLeft(profile) : 0;
  const trialExpired = profile?.plan === "trial" && !trialOn;
  const accountPaused = profile ? isPaused(profile) : false;

  // Limit by plan: free=2, trial=5, pro=unlimited
  const drawingLimit =
    effectivePlan === "pro" ? Infinity
    : effectivePlan === "trial" ? TRIAL_DRAWING_LIMIT
    : FREE_DRAWING_LIMIT;

  // After trial expires: only the most-recent drawing stays unlocked
  const lockedIds = trialExpired
    ? new Set(drawings.slice(1).map((d) => d.id))
    : new Set<string>();

  const handleCreate = () => {
    if (accountPaused) { setShowUpgradeModal(true); return; }
    if (drawings.length >= drawingLimit) { setShowUpgradeModal(true); return; }
    setShowTypePicker(true);
  };

  const handleTypeSelect = (type: DrawingType) => {
    setShowTypePicker(false);
    if (type === "mindmap") {
      handleCreateMindMap();
    } else {
      setShowTemplatePicker(true);
    }
  };

  const handleCreateMindMap = async () => {
    try {
      const drawing = await createDrawing("Sin título", "mindmap");
      if (activeFolderId && activeFolderId !== "all") {
        await moveDrawingToFolder(drawing.id, activeFolderId);
      }
      onOpenDrawing(drawing.id);
    } catch (err: any) {
      if (err instanceof DrawingLimitError) { setShowTypePicker(false); setShowUpgradeModal(true); return; }
      alert("Error al crear el mapa mental.\n\n" + (err?.message ?? String(err)));
    }
  };

  const handleTemplateSelect = async (template: Template) => {
    setShowTemplatePicker(false);
    try {
      const drawing = await createDrawing(
        template.id === "blank" ? "Sin título" : template.name,
        "canvas",
      );
      if (template.id !== "blank") {
        await saveDrawing(drawing.id, template.content as any);
      }
      if (activeFolderId && activeFolderId !== "all") {
        await moveDrawingToFolder(drawing.id, activeFolderId);
      }
      onOpenDrawing(drawing.id);
    } catch (err: any) {
      if (err instanceof DrawingLimitError) { setShowUpgradeModal(true); return; }
      throw err;
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar este dibujo?")) return;
    await deleteDrawing(id);
    setDrawings((prev) => prev.filter((d) => d.id !== id));
  };

  const startRename = (drawing: Drawing, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(drawing.id);
    setRenameValue(drawing.name);
  };

  const commitRename = async (id: string) => {
    const name = renameValue.trim() || "Sin título";
    await renameDrawing(id, name);
    setDrawings((prev) => prev.map((d) => (d.id === id ? { ...d, name } : d)));
    setRenamingId(null);
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    const folder = await createFolder(name);
    setFolders((prev) => [...prev, folder]);
    setNewFolderMode(false);
    setNewFolderName("");
    setActiveFolderId(folder.id);
  };

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar esta carpeta? Los dibujos no se borran.")) return;
    await deleteFolder(id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
    if (activeFolderId === id) setActiveFolderId("all");
  };

  const commitRenameFolder = async (id: string) => {
    const name = renameFolderValue.trim() || "Sin nombre";
    await renameFolder(id, name);
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
    setRenamingFolderId(null);
  };

  const handleMoveDrawing = async (
    drawingId: string,
    folderId: string | null,
  ) => {
    await moveDrawingToFolder(drawingId, folderId);
    setDrawings((prev) =>
      prev.map((d) => (d.id === drawingId ? { ...d, folder_id: folderId } : d)),
    );
    setMovingDrawingId(null);
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    if (!confirm(`¿Eliminar ${selectedIds.size} dibujo${selectedIds.size !== 1 ? "s" : ""}?`)) return;
    await Promise.all([...selectedIds].map((id) => deleteDrawing(id)));
    setDrawings((prev) => prev.filter((d) => !selectedIds.has(d.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const visibleDrawings = drawings
    .filter((d) => activeFolderId === "all" || d.folder_id === activeFolderId)
    .filter((d) => !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="dashboard">
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} currentPlan={effectivePlan} />
      )}

      {showTypePicker && (
        <TypePicker
          onSelect={handleTypeSelect}
          onCancel={() => setShowTypePicker(false)}
        />
      )}

      {showTemplatePicker && (
        <TemplatePicker
          onSelect={handleTemplateSelect}
          onCancel={() => setShowTemplatePicker(false)}
        />
      )}

      {/* Move drawing popover */}
      {movingDrawingId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            background: "rgba(0,0,0,0.3)",
          }}
          onClick={() => setMovingDrawingId(null)}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              minWidth: 260,
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>
              Mover a carpeta
            </div>
            <div
              onClick={() => handleMoveDrawing(movingDrawingId, null)}
              style={{
                padding: "8px 10px",
                cursor: "pointer",
                borderRadius: 6,
                fontSize: 13,
                background: "#f5f5f5",
                marginBottom: 6,
              }}
            >
              📁 Sin carpeta
            </div>
            {folders.map((f) => (
              <div
                key={f.id}
                onClick={() => handleMoveDrawing(movingDrawingId, f.id)}
                style={{
                  padding: "8px 10px",
                  cursor: "pointer",
                  borderRadius: 6,
                  fontSize: 13,
                  marginBottom: 4,
                  background: "#f5f5f5",
                }}
              >
                📂 {f.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
            <path
              d="M3 17L9 11L13 15L21 7"
              stroke="#6965db"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="dashboard-title">Mis dibujos</span>
        </div>
        <div className="dashboard-header-right">
          <span className="dashboard-user">{user?.email}</span>
          {/* Plan badge */}
          {profile && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              ...(effectivePlan === "pro"
                ? { background: "#d1fae5", color: "#065f46" }
                : effectivePlan === "trial"
                ? { background: "#fef3c7", color: "#92400e" }
                : { background: "#f3f4f6", color: "#6b7280" }),
            }}>
              {accountPaused ? "⏸ Pausado" : effectivePlan === "pro" ? "⭐ Pro" : effectivePlan === "trial" ? `🚀 Trial · ${daysLeft}d` : "🆓 Free"}
            </span>
          )}
          {onOpenAdmin && (
            <button onClick={onOpenAdmin} style={{ padding: "6px 14px", background: "#f0eeff", color: "#6128ff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              ⚙ Admin
            </button>
          )}
          <button className="dashboard-btn-logout" onClick={() => signOut()}>
            Salir
          </button>
        </div>
      </header>

      {/* Trial banner */}
      {trialOn && (
        <div style={{
          background: "linear-gradient(94deg, #4a0fcc, #6128ff)",
          color: "#fff", padding: "10px 28px", fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span>
            🚀 <strong>Período de prueba activo</strong> · Acceso Pro completo ·{" "}
            <strong>{daysLeft} día{daysLeft !== 1 ? "s" : ""} restante{daysLeft !== 1 ? "s" : ""}</strong>
          </span>
          <span style={{ opacity: 0.8, fontSize: 12 }}>
            Después del trial solo quedará 1 dibujo activo
          </span>
        </div>
      )}
      {trialExpired && (
        <div style={{
          background: "#fff3cd", color: "#856404", padding: "10px 28px",
          fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid #ffc107",
        }}>
          <span>
            ⚠️ <strong>Tu período de prueba terminó.</strong>{" "}
            {lockedIds.size} dibujo{lockedIds.size !== 1 ? "s" : ""} bloqueado{lockedIds.size !== 1 ? "s" : ""}.
          </span>
          <button
            onClick={() => setShowUpgradeModal(true)}
            style={{
              padding: "5px 16px", background: "#6128ff", color: "#fff",
              border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            Desbloquear todo →
          </button>
        </div>
      )}

      {accountPaused && (
        <div style={{
          background: "#fef2f2", color: "#991b1b", padding: "10px 28px",
          fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid #fca5a5",
        }}>
          <span>
            ⏸ <strong>Tu acceso está pausado.</strong>{" "}
            Podés ver tus dibujos pero no crear ni editar hasta regularizar el pago.
          </span>
          <a
            href={getHotmartCheckoutUrl()}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "5px 16px", background: "#6128ff", color: "#fff",
              borderRadius: 6, fontSize: 12, fontWeight: 700,
              textDecoration: "none", whiteSpace: "nowrap",
            }}
          >
            Reactivar acceso →
          </a>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar de carpetas */}
        <aside
          style={{
            width: 200,
            borderRight: "1px solid #eee",
            padding: "16px 10px",
            background: "#fafafa",
            flexShrink: 0,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#aaa",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
              paddingLeft: 4,
            }}
          >
            Carpetas
          </div>

          {/* All */}
          <div
            onClick={() => setActiveFolderId("all")}
            style={{
              padding: "7px 10px",
              borderRadius: 7,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: activeFolderId === "all" ? 700 : 400,
              background: activeFolderId === "all" ? "#e0dfff" : "transparent",
              color: activeFolderId === "all" ? "#6965db" : "#444",
              marginBottom: 2,
            }}
          >
            📋 Todos ({drawings.length})
          </div>

          {/* Folders */}
          {folders.map((f) => (
            <div
              key={f.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 8px",
                borderRadius: 7,
                cursor: "pointer",
                background: activeFolderId === f.id ? "#e0dfff" : "transparent",
                color: activeFolderId === f.id ? "#6965db" : "#444",
                marginBottom: 2,
                gap: 4,
              }}
              onClick={() => setActiveFolderId(f.id)}
            >
              <span style={{ fontSize: 14 }}>📂</span>
              {renamingFolderId === f.id ? (
                <input
                  autoFocus
                  value={renameFolderValue}
                  onChange={(e) => setRenameFolderValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => commitRenameFolder(f.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRenameFolder(f.id);
                    if (e.key === "Escape") setRenamingFolderId(null);
                  }}
                  style={{
                    flex: 1,
                    fontSize: 12,
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    padding: "2px 4px",
                    minWidth: 0,
                  }}
                />
              ) : (
                <>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.name}
                  </span>
                  <span style={{ fontSize: 11, color: "#bbb" }}>
                    {drawings.filter((d) => d.folder_id === f.id).length}
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingFolderId(f.id);
                      setRenameFolderValue(f.name);
                    }}
                    style={{ cursor: "pointer", opacity: 0.5, fontSize: 11 }}
                    title="Renombrar"
                  >
                    ✏️
                  </span>
                  <span
                    onClick={(e) => handleDeleteFolder(f.id, e)}
                    style={{ cursor: "pointer", opacity: 0.5, fontSize: 11 }}
                    title="Eliminar"
                  >
                    🗑️
                  </span>
                </>
              )}
            </div>
          ))}

          {/* New folder */}
          {newFolderMode ? (
            <div style={{ padding: "4px 6px", marginTop: 4 }}>
              <input
                autoFocus
                placeholder="Nombre..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") setNewFolderMode(false);
                }}
                style={{
                  width: "100%",
                  fontSize: 12,
                  padding: "5px 7px",
                  border: "1px solid #ccc",
                  borderRadius: 5,
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                <button
                  onClick={handleCreateFolder}
                  style={{
                    flex: 1,
                    fontSize: 11,
                    padding: "4px",
                    background: "#6965db",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Crear
                </button>
                <button
                  onClick={() => setNewFolderMode(false)}
                  style={{
                    flex: 1,
                    fontSize: 11,
                    padding: "4px",
                    background: "#eee",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setNewFolderMode(true)}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "6px",
                fontSize: 12,
                background: "none",
                border: "1px dashed #ccc",
                borderRadius: 6,
                cursor: "pointer",
                color: "#888",
              }}
            >
              + Nueva carpeta
            </button>
          )}
        </aside>

        {/* Main content */}
        <main className="dashboard-main" style={{ flex: 1, overflowY: "auto" }}>
          <div className="dashboard-actions" style={{ flexWrap: "wrap", gap: 8 }}>
            <button className="dashboard-btn-new" onClick={handleCreate}>
              + Nuevo dibujo
            </button>

            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: 180, maxWidth: 300 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#bbb", pointerEvents: "none" }}>🔍</span>
              <input
                type="text"
                placeholder="Buscar dibujo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%", padding: "7px 10px 7px 32px", fontSize: 13,
                  border: "1.5px solid #e0e0f0", borderRadius: 8, outline: "none",
                  boxSizing: "border-box", fontFamily: "inherit", color: "#333",
                  background: "#fafafa",
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#bbb" }}>
                  ×
                </button>
              )}
            </div>

            {/* Bulk select toggle */}
            {!selectMode ? (
              <button onClick={() => setSelectMode(true)}
                style={{ padding: "7px 14px", background: "#f5f4ff", color: "#6128ff", border: "1.5px solid #e0e0f0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Seleccionar
              </button>
            ) : (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888" }}>{selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}</span>
                <button onClick={handleBulkDelete} disabled={!selectedIds.size}
                  style={{ padding: "7px 14px", background: selectedIds.size ? "#e53e3e" : "#eee", color: selectedIds.size ? "#fff" : "#bbb", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: selectedIds.size ? "pointer" : "default" }}>
                  🗑 Eliminar
                </button>
                <button onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }}
                  style={{ padding: "7px 14px", background: "none", border: "1.5px solid #e0e0f0", borderRadius: 8, fontSize: 12, color: "#888", cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            )}

            {/* Drawing limit counter */}
            {effectivePlan !== "pro" && (
              <span style={{ fontSize: 12, color: drawings.length >= drawingLimit ? "#e53e3e" : "#999", marginLeft: "auto" }}>
                {drawings.length}/{drawingLimit}{effectivePlan === "trial" ? " (trial)" : " (free)"}
              </span>
            )}
          </div>

          {loading ? (
            <div className="dashboard-loading">Cargando...</div>
          ) : visibleDrawings.length === 0 ? (
            <div className="dashboard-empty">
              <p>
                {activeFolderId === "all"
                  ? "No tienes dibujos aún."
                  : "Esta carpeta está vacía."}
              </p>
              <button className="dashboard-btn-new" onClick={handleCreate}>
                Crear primer dibujo
              </button>
            </div>
          ) : (
            <div className="dashboard-grid">
              {visibleDrawings.map((drawing) => (
                <div
                  key={drawing.id}
                  className="dashboard-card"
                  onClick={(e) => {
                    if (selectMode) { toggleSelect(drawing.id, e); return; }
                    if (accountPaused || lockedIds.has(drawing.id)) { setShowUpgradeModal(true); return; }
                    onOpenDrawing(drawing.id);
                  }}
                  style={{
                    ...(lockedIds.has(drawing.id) ? { opacity: 0.7 } : {}),
                    ...(selectedIds.has(drawing.id) ? { outline: "2.5px solid #6128ff", outlineOffset: 2 } : {}),
                    cursor: "pointer",
                  }}
                >
                  <div className="dashboard-card-preview" style={{ position: "relative" }}>
                    {selectMode && (
                      <div style={{
                        position: "absolute", top: 8, left: 8, zIndex: 10,
                        width: 22, height: 22, borderRadius: 6,
                        border: `2px solid ${selectedIds.has(drawing.id) ? "#6128ff" : "#ccc"}`,
                        background: selectedIds.has(drawing.id) ? "#6128ff" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                      }}>
                        {selectedIds.has(drawing.id) && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
                      </div>
                    )}
                    {drawing.type === "mindmap" && (
                      <div style={{
                        position: "absolute", top: 8, left: 8,
                        background: "#6965db", color: "#fff",
                        borderRadius: 6, padding: "2px 7px",
                        fontSize: 10, fontWeight: 700, zIndex: 2,
                        letterSpacing: 0.3,
                      }}>
                        Mapa mental
                      </div>
                    )}
                    {drawing.thumbnail ? (
                      <img src={drawing.thumbnail} alt={drawing.name} />
                    ) : (
                      <div className="dashboard-card-placeholder">
                        {drawing.type === "mindmap" ? (
                          <span style={{ fontSize: 36 }}>🧠</span>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="#c8c6e8" strokeWidth="1.5" />
                            <path d="M7 14L10 11L13 14L17 10" stroke="#c8c6e8" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>
                    )}
                    {lockedIds.has(drawing.id) && (
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "rgba(255,255,255,0.85)",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        gap: 4, borderRadius: "inherit",
                      }}>
                        <span style={{ fontSize: 24 }}>🔒</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#6128ff" }}>
                          Pro
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="dashboard-card-info">
                    {renamingId === drawing.id ? (
                      <input
                        className="dashboard-card-rename"
                        value={renameValue}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(drawing.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(drawing.id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                      />
                    ) : (
                      <span className="dashboard-card-name">
                        {drawing.name}
                      </span>
                    )}
                    <span className="dashboard-card-date">
                      {formatDate(drawing.updated_at)}
                    </span>
                  </div>

                  {!selectMode && (
                    <div className="dashboard-card-actions">
                      <button title="Mover a carpeta" onClick={(e) => { e.stopPropagation(); setMovingDrawingId(drawing.id); }}>📂</button>
                      <button title="Renombrar" onClick={(e) => startRename(drawing, e)}>✏️</button>
                      <button title="Eliminar" onClick={(e) => handleDelete(drawing.id, e)}>🗑️</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
