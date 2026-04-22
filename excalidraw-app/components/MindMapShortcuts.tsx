import { useEffect } from "react";

const SHORTCUTS = [
  {
    section: "Nodos",
    items: [
      { keys: ["Tab"], desc: "Agregar nodo hijo" },
      { keys: ["Enter"], desc: "Agregar nodo hermano" },
      { keys: ["F2"], desc: "Editar texto del nodo" },
      { keys: ["Del", "Backspace"], desc: "Eliminar nodo" },
      { keys: ["↑ ↓ ← →"], desc: "Navegar entre nodos" },
    ],
  },
  {
    section: "Canvas",
    items: [
      { keys: ["H"], desc: "Activar / desactivar modo mano" },
      { keys: ["L"], desc: "Activar / desactivar puntero láser" },
      { keys: ["Ctrl", "Rueda"], desc: "Zoom in / out" },
      { keys: ["Ctrl", "Z"], desc: "Deshacer" },
      { keys: ["Ctrl", "Y"], desc: "Rehacer" },
    ],
  },
  {
    section: "Texto (al editar)",
    items: [
      { keys: ["Enter"], desc: "Guardar cambio" },
      { keys: ["Esc"], desc: "Cancelar edición" },
    ],
  },
];

interface Props {
  onClose: () => void;
}

export const MindMapShortcuts = ({ onClose }: Props) => {
  // Close on Escape or ? key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,12,40,0.45)",
        zIndex: 500,
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          padding: "28px 32px",
          width: 420,
          maxWidth: "92vw",
          maxHeight: "85vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg,#6965db,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>⌨️</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#222" }}>Atajos de teclado</div>
              <div style={{ fontSize: 11, color: "#999" }}>Presioná <Kbd>?</Kbd> o <Kbd>Esc</Kbd> para cerrar</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 20, lineHeight: 1, padding: "2px 4px" }}
          >×</button>
        </div>

        {/* Sections */}
        {SHORTCUTS.map((section) => (
          <div key={section.section}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: "#6965db",
              letterSpacing: ".1em", textTransform: "uppercase",
              marginBottom: 10, paddingBottom: 6,
              borderBottom: "1.5px solid #f0efff",
            }}>
              {section.section}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {section.items.map((item) => (
                <div key={item.desc} style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 0",
                }}>
                  <span style={{ fontSize: 13, color: "#444" }}>{item.desc}</span>
                  <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0, marginLeft: 16 }}>
                    {item.keys.map((k, i) => (
                      <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Kbd>{k}</Kbd>
                        {i < item.keys.length - 1 && (
                          <span style={{ fontSize: 10, color: "#bbb" }}>+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer tip */}
        <div style={{
          background: "#f9f8ff", borderRadius: 10, padding: "10px 14px",
          fontSize: 12, color: "#6965db", fontWeight: 500,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>💡</span>
          Hacé clic en cualquier nodo para ver opciones de estilo a la derecha.
        </div>
      </div>
    </div>
  );
};

// Small keyboard key badge
const Kbd = ({ children }: { children: React.ReactNode }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    background: "#f4f3ff",
    border: "1.5px solid #dddaff",
    borderBottom: "3px solid #c5c0ff",
    borderRadius: 6,
    padding: "2px 7px",
    fontSize: 11,
    fontWeight: 700,
    color: "#5551c4",
    fontFamily: "monospace",
    whiteSpace: "nowrap",
    minWidth: 24,
  }}>
    {children}
  </span>
);
