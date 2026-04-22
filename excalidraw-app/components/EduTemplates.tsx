import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { restoreElements } from "@excalidraw/excalidraw";

// ── Template definitions ──────────────────────────────────────────────────────

type Template = {
  id: string;
  name: string;
  icon: string;
  desc: string;
  color: string;
  elements: () => any[];
};

const makeText = (
  id: string, x: number, y: number, text: string,
  opts: { fontSize?: number; bold?: boolean; color?: string } = {},
) => ({
  id, type: "text", x, y, width: text.length * (opts.fontSize ?? 20) * 0.6, height: opts.fontSize ?? 20,
  angle: 0, strokeColor: opts.color ?? "#1e1e2e", backgroundColor: "transparent",
  fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid", roughness: 1,
  opacity: 100, groupIds: [], frameId: null, index: "a0",
  roundness: null, seed: Math.floor(Math.random() * 9999), version: 1,
  versionNonce: 0, isDeleted: false, boundElements: null,
  updated: Date.now(), link: null, locked: false,
  text, fontSize: opts.fontSize ?? 20,
  fontFamily: 1, textAlign: "center", verticalAlign: "middle",
  containerId: null, originalText: text, autoResize: true,
  lineHeight: 1.2,
});

const makeRect = (
  id: string, x: number, y: number, w: number, h: number,
  opts: { bg?: string; stroke?: string; label?: string } = {},
) => {
  const base: any = {
    id, type: "rectangle", x, y, width: w, height: h,
    angle: 0, strokeColor: opts.stroke ?? "#6965db",
    backgroundColor: opts.bg ?? "transparent",
    fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid",
    roughness: 1, opacity: 100, groupIds: [], frameId: null, index: "a0",
    roundness: { type: 3 }, seed: Math.floor(Math.random() * 9999),
    version: 1, versionNonce: 0, isDeleted: false,
    boundElements: opts.label ? [{ type: "text", id: `${id}-lbl` }] : null,
    updated: Date.now(), link: null, locked: false,
  };
  return base;
};

const makeEllipse = (
  id: string, x: number, y: number, w: number, h: number,
  opts: { bg?: string; stroke?: string } = {},
) => ({
  id, type: "ellipse", x, y, width: w, height: h,
  angle: 0, strokeColor: opts.stroke ?? "#6965db",
  backgroundColor: opts.bg ?? "transparent",
  fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid",
  roughness: 1, opacity: 100, groupIds: [], frameId: null, index: "a0",
  roundness: { type: 2 }, seed: Math.floor(Math.random() * 9999),
  version: 1, versionNonce: 0, isDeleted: false,
  boundElements: null, updated: Date.now(), link: null, locked: false,
});

const makeArrow = (
  id: string, x1: number, y1: number, x2: number, y2: number,
) => ({
  id, type: "arrow", x: x1, y: y1,
  width: x2 - x1, height: y2 - y1,
  angle: 0, strokeColor: "#aaa", backgroundColor: "transparent",
  fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid",
  roughness: 1, opacity: 100, groupIds: [], frameId: null, index: "a0",
  roundness: { type: 2 }, seed: Math.floor(Math.random() * 9999),
  version: 1, versionNonce: 0, isDeleted: false,
  boundElements: null, updated: Date.now(), link: null, locked: false,
  points: [[0, 0], [x2 - x1, y2 - y1]],
  lastCommittedPoint: null, startBinding: null, endBinding: null,
  startArrowhead: null, endArrowhead: "arrow", elbowed: false,
});

const TEMPLATES: Template[] = [
  {
    id: "timeline",
    name: "Línea de tiempo",
    icon: "📅",
    desc: "5 eventos ordenados cronológicamente",
    color: "#e0f2fe",
    elements: () => {
      const els: any[] = [];
      // Central line
      els.push({ ...makeRect("tl-line", 50, 280, 900, 4, { bg: "#6965db", stroke: "#6965db" }) });
      const events = ["Evento 1", "Evento 2", "Evento 3", "Evento 4", "Evento 5"];
      events.forEach((label, i) => {
        const x = 80 + i * 185;
        const above = i % 2 === 0;
        const boxY = above ? 130 : 320;
        const connY1 = above ? 210 : 284;
        const connY2 = above ? 282 : 320;
        els.push(makeRect(`tl-box-${i}`, x, boxY, 160, 70, { bg: "#ede9fe", stroke: "#6965db" }));
        els.push(makeText(`tl-txt-${i}`, x + 80, boxY + 35, label, { fontSize: 14 }));
        els.push(makeArrow(`tl-arr-${i}`, x + 80, connY1, x + 80, connY2));
        // Year dot
        els.push(makeEllipse(`tl-dot-${i}`, x + 68, 271, 24, 24, { bg: "#6965db", stroke: "#6965db" }));
        els.push(makeText(`tl-yr-${i}`, x + 80, 283, `${2020 + i}`, { fontSize: 10, color: "#fff" }));
      });
      return els;
    },
  },
  {
    id: "venn",
    name: "Diagrama de Venn",
    icon: "⭕",
    desc: "2 conjuntos con zona de intersección",
    color: "#fce7f3",
    elements: () => [
      makeEllipse("vn-a", 100, 150, 380, 300, { bg: "rgba(99,101,219,0.15)", stroke: "#6965db" }),
      makeEllipse("vn-b", 320, 150, 380, 300, { bg: "rgba(236,72,153,0.15)", stroke: "#ec4899" }),
      makeText("vn-la", 210, 200, "Solo A", { fontSize: 16 }),
      makeText("vn-lb", 610, 200, "Solo B", { fontSize: 16 }),
      makeText("vn-int", 410, 200, "Ambos", { fontSize: 16 }),
      makeText("vn-ta", 200, 155, "Conjunto A", { fontSize: 18, bold: true, color: "#6965db" }),
      makeText("vn-tb", 620, 155, "Conjunto B", { fontSize: 18, bold: true, color: "#ec4899" }),
    ],
  },
  {
    id: "comparison",
    name: "Cuadro comparativo",
    icon: "📊",
    desc: "2 columnas para comparar conceptos",
    color: "#ecfdf5",
    elements: () => {
      const els: any[] = [];
      const headers = ["Concepto A", "Concepto B"];
      const rows = ["Característica 1", "Característica 2", "Característica 3", "Característica 4"];
      // Header row
      headers.forEach((h, i) => {
        els.push(makeRect(`cm-h${i}`, 50 + i * 340, 50, 320, 60, { bg: "#6965db", stroke: "#6965db" }));
        els.push(makeText(`cm-ht${i}`, 210 + i * 340, 80, h, { fontSize: 18, color: "#fff" }));
      });
      rows.forEach((row, r) => {
        [0, 1].forEach((c) => {
          const bg = r % 2 === 0 ? "#f5f3ff" : "#fff";
          els.push(makeRect(`cm-c${r}${c}`, 50 + c * 340, 120 + r * 70, 320, 70, { bg, stroke: "#e0dfff" }));
          if (c === 0) els.push(makeText(`cm-rt${r}`, 210, 155 + r * 70, row, { fontSize: 14 }));
          else els.push(makeText(`cm-ct${r}${c}`, 550, 155 + r * 70, "...", { fontSize: 14, color: "#aaa" }));
        });
      });
      return els;
    },
  },
  {
    id: "cycle",
    name: "Ciclo / Proceso",
    icon: "🔄",
    desc: "4 etapas en ciclo circular",
    color: "#fff7ed",
    elements: () => {
      const els: any[] = [];
      const steps = ["Planificar", "Ejecutar", "Evaluar", "Mejorar"];
      const cx = 400, cy = 280, r = 180;
      steps.forEach((step, i) => {
        const angle = (i * Math.PI) / 2 - Math.PI / 4;
        const bx = cx + r * Math.cos(angle) - 90;
        const by = cy + r * Math.sin(angle) - 35;
        const colors = ["#6965db", "#10b981", "#f59e0b", "#ef4444"];
        els.push(makeRect(`cy-b${i}`, bx, by, 180, 70, { bg: `${colors[i]}22`, stroke: colors[i] }));
        els.push(makeText(`cy-t${i}`, bx + 90, by + 35, step, { fontSize: 16, color: colors[i] }));
        // Arrow to next
        const nextAngle = ((i + 1) * Math.PI) / 2 - Math.PI / 4;
        const ax1 = cx + (r - 10) * Math.cos(angle + 0.6);
        const ay1 = cy + (r - 10) * Math.sin(angle + 0.6);
        const ax2 = cx + (r - 10) * Math.cos(nextAngle - 0.6);
        const ay2 = cy + (r - 10) * Math.sin(nextAngle - 0.6);
        els.push(makeArrow(`cy-a${i}`, ax1, ay1, ax2, ay2));
      });
      return els;
    },
  },
  {
    id: "concept-map",
    name: "Mapa conceptual",
    icon: "🗺️",
    desc: "Concepto central con 4 ramas",
    color: "#f0fdf4",
    elements: () => {
      const els: any[] = [];
      // Center
      els.push(makeRect("mc-center", 330, 230, 200, 60, { bg: "#6965db", stroke: "#6965db" }));
      els.push(makeText("mc-ct", 430, 260, "Concepto central", { fontSize: 16, color: "#fff" }));
      const branches = [
        { x: 60, y: 80, label: "Idea A" },
        { x: 600, y: 80, label: "Idea B" },
        { x: 60, y: 400, label: "Idea C" },
        { x: 600, y: 400, label: "Idea D" },
      ];
      branches.forEach((b, i) => {
        els.push(makeRect(`mc-b${i}`, b.x, b.y, 160, 50, { bg: "#ede9fe", stroke: "#6965db" }));
        els.push(makeText(`mc-bt${i}`, b.x + 80, b.y + 25, b.label, { fontSize: 14 }));
        els.push(makeArrow(`mc-a${i}`, b.x + 80, b.y + 50, 430, 260));
      });
      return els;
    },
  },
  {
    id: "cause-effect",
    name: "Causa y efecto",
    icon: "🐟",
    desc: "Espina de pescado (Ishikawa)",
    color: "#fff1f2",
    elements: () => {
      const els: any[] = [];
      // Spine
      els.push(makeArrow("ce-spine", 80, 280, 780, 280));
      // Effect box
      els.push(makeRect("ce-effect", 780, 245, 160, 70, { bg: "#fee2e2", stroke: "#ef4444" }));
      els.push(makeText("ce-et", 860, 280, "Efecto", { fontSize: 16, color: "#ef4444" }));
      // Branches
      const causes = [
        { x: 200, label: "Causa 1" }, { x: 350, label: "Causa 2" },
        { x: 500, label: "Causa 3" }, { x: 650, label: "Causa 4" },
      ];
      causes.forEach((c, i) => {
        const yTop = 150, yBot = 410;
        els.push(makeArrow(`ce-at${i}`, c.x, yTop, c.x + 40, 280));
        els.push(makeArrow(`ce-ab${i}`, c.x, yBot, c.x + 40, 280));
        els.push(makeRect(`ce-bt${i}`, c.x - 60, yTop - 30, 130, 40, { bg: "#fef3c7", stroke: "#f59e0b" }));
        els.push(makeRect(`ce-bb${i}`, c.x - 60, yBot - 10, 130, 40, { bg: "#fef3c7", stroke: "#f59e0b" }));
        els.push(makeText(`ce-tt${i}`, c.x + 5, yTop - 10, c.label, { fontSize: 12 }));
        els.push(makeText(`ce-tb${i}`, c.x + 5, yBot + 10, c.label, { fontSize: 12 }));
      });
      return els;
    },
  },
];

// ── Modal component ───────────────────────────────────────────────────────────

export const EduTemplatesModal = ({
  excalidrawAPI,
  onClose,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI;
  onClose: () => void;
}) => {
  const applyTemplate = (t: Template) => {
    const rawElements = t.elements();
    const restored = restoreElements(rawElements, null, { repairBindings: true, deleteInvisibleElements: false });
    excalidrawAPI.updateScene({ elements: restored as any });
    excalidrawAPI.scrollToContent(restored as any, { animate: true, fitToViewport: true });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(0,0,0,0.5)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: 760,
          maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.2)", fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid #f0eeff" }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>
            📚 Plantillas educativas
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
            Seleccioná una plantilla para insertar en tu pizarrón
          </p>
        </div>

        {/* Grid */}
        <div style={{
          overflowY: "auto", padding: "20px 24px",
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14,
        }}>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t)}
              style={{
                background: t.color, border: "1.5px solid transparent",
                borderRadius: 14, padding: "18px 16px", cursor: "pointer",
                textAlign: "left", transition: "all 0.15s", fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#6965db";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(105,101,219,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: 30, marginBottom: 8 }}>{t.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e", marginBottom: 4 }}>
                {t.name}
              </div>
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.4 }}>{t.desc}</div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #f0eeff" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 24px", borderRadius: 8, border: "none",
              background: "#f0eeff", color: "#6128ff", fontWeight: 600,
              fontSize: 14, cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
