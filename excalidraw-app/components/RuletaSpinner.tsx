import { useEffect, useRef, useState } from "react";

interface Props {
  onClose: () => void;
}

const COLORS = [
  "#6965db","#3b82f6","#10b981","#f59e0b",
  "#ef4444","#8b5cf6","#ec4899","#14b8a6",
  "#f97316","#06b6d4","#84cc16","#a855f7",
];

const DEFAULT_NAMES = "Estudiante 1\nEstudiante 2\nEstudiante 3\nEstudiante 4\nEstudiante 5";

export const RuletaSpinner = ({ onClose }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [namesInput, setNamesInput] = useState(DEFAULT_NAMES);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const angleRef = useRef(0);
  const velRef = useRef(0);
  const rafRef = useRef(0);

  const names = namesInput.split("\n").map((n) => n.trim()).filter(Boolean);

  const draw = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(cx, cy) - 16;
    const n = names.length;
    if (n === 0) { ctx.clearRect(0, 0, W, H); return; }
    const slice = (2 * Math.PI) / n;

    ctx.clearRect(0, 0, W, H);

    names.forEach((name, i) => {
      const start = angle + i * slice;
      const end = start + slice;
      const mid = (start + end) / 2;

      // Sector
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, start, end);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(mid);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(11, Math.min(16, 200 / n))}px system-ui`;
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 3;
      const label = name.length > 14 ? name.slice(0, 13) + "…" : name;
      ctx.fillText(label, R - 14, 5);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Pointer (top)
    const px = cx, py = 8;
    ctx.beginPath();
    ctx.moveTo(px, py + 28);
    ctx.lineTo(px - 12, py);
    ctx.lineTo(px + 12, py);
    ctx.closePath();
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
  };

  useEffect(() => { draw(angleRef.current); }, [names.join(",")]);

  const spin = () => {
    if (spinning || names.length < 2) return;
    setWinner(null);
    setSpinning(true);
    velRef.current = 0.25 + Math.random() * 0.25; // rad/frame

    const animate = () => {
      angleRef.current += velRef.current;
      velRef.current *= 0.988; // friction
      draw(angleRef.current);

      if (velRef.current > 0.003) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        // Compute winner: pointer at top = angle 0 from right = -PI/2
        const n = names.length;
        const slice = (2 * Math.PI) / n;
        // Normalize angle so pointer (top = -PI/2) maps to a sector
        const norm = ((-angleRef.current - Math.PI / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const idx = Math.floor(norm / slice) % n;
        setWinner(names[idx]);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,12,40,0.55)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 24, boxShadow: "0 24px 80px rgba(0,0,0,0.3)", padding: "28px 32px", display: "flex", gap: 28, alignItems: "flex-start", maxWidth: "90vw" }}>

        {/* Left: wheel */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e" }}>🎡 Ruleta de clase</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 20 }}>×</button>
          </div>

          <canvas ref={canvasRef} width={320} height={320}
            style={{ borderRadius: "50%", boxShadow: "0 8px 32px rgba(105,101,219,.25)", cursor: spinning ? "wait" : "pointer" }}
            onClick={spin} />

          <button onClick={spin} disabled={spinning || names.length < 2}
            style={{ background: spinning ? "#ddd" : "linear-gradient(135deg,#6965db,#8b5cf6)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 36px", fontSize: 16, fontWeight: 800, cursor: spinning ? "wait" : "pointer", width: "100%", transition: "all .2s" }}>
            {spinning ? "Girando…" : "🎯 ¡Girar!"}
          </button>

          {winner && (
            <div style={{ background: "linear-gradient(135deg,#6965db,#8b5cf6)", borderRadius: 14, padding: "14px 24px", textAlign: "center", width: "100%", animation: "popIn .3s cubic-bezier(.34,1.56,.64,1)" }}>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>🏆 Seleccionado</div>
              <div style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>{winner}</div>
            </div>
          )}
        </div>

        {/* Right: names */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 180 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: ".05em" }}>
              Participantes ({names.length})
            </span>
            <button onClick={() => setEditing((v) => !v)}
              style={{ fontSize: 11, fontWeight: 700, color: "#6965db", background: "#f0efff", border: "none", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>
              {editing ? "✓ Listo" : "✏️ Editar"}
            </button>
          </div>

          {editing ? (
            <textarea value={namesInput} onChange={(e) => setNamesInput(e.target.value)}
              placeholder="Un nombre por línea…"
              style={{ width: 180, height: 240, border: "1.5px solid #e0e0e0", borderRadius: 10, padding: "8px 10px", fontSize: 13, resize: "none", outline: "none", lineHeight: 1.6 }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 260, overflowY: "auto" }}>
              {names.map((n, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: winner === n ? "#f0efff" : "#fafafa", border: `1.5px solid ${winner === n ? "#6965db" : "#f0f0f0"}`, fontWeight: winner === n ? 700 : 400, color: winner === n ? "#6965db" : "#444", fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  {n}
                  {winner === n && " 🏆"}
                </div>
              ))}
            </div>
          )}

          <button onClick={() => { setNamesInput(DEFAULT_NAMES); setWinner(null); }}
            style={{ fontSize: 11, color: "#bbb", background: "none", border: "1px solid #eee", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
            Restablecer nombres
          </button>
        </div>
      </div>
      <style>{`@keyframes popIn { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
};
