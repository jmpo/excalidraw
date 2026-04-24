import { useEffect, useRef, useState } from "react";

interface Props {
  onClose: () => void;
}

const beep = (ctx: AudioContext, freq = 880, duration = 0.18, gain = 0.4) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
};

const playFinish = (ctx: AudioContext) => {
  [0, 0.22, 0.44, 0.66].forEach((t) => {
    setTimeout(() => beep(ctx, 880, 0.18), t * 1000);
  });
};

export const ClassTimer = ({ onClose }: Props) => {
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [totalSecs, setTotalSecs] = useState(5 * 60);
  const [remaining, setRemaining] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [inputMin, setInputMin] = useState("5");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const getAudio = () => {
    if (!audioRef.current) audioRef.current = new AudioContext();
    return audioRef.current;
  };

  const start = () => {
    const total = parseInt(inputMin || "0") * 60 + (seconds || 0);
    if (total <= 0) return;
    setTotalSecs(total);
    setRemaining(total);
    setFinished(false);
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setFinished(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const total = parseInt(inputMin || "0") * 60;
    setTotalSecs(total);
    setRemaining(total);
  };

  useEffect(() => {
    if (!running) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setFinished(true);
          playFinish(getAudio());
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  // Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !fullscreen) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, onClose]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = totalSecs > 0 ? remaining / totalSecs : 1;
  const urgent = remaining <= 30 && running;
  const radius = fullscreen ? 160 : 90;
  const stroke = fullscreen ? 12 : 7;
  const circ = 2 * Math.PI * radius;

  const panelStyle: React.CSSProperties = fullscreen
    ? { position: "fixed", inset: 0, background: finished ? "#1a0a00" : "#0f0f1a", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }
    : { position: "fixed", bottom: 80, right: 20, background: "#fff", borderRadius: 20, boxShadow: "0 12px 48px rgba(0,0,0,.2)", padding: "24px 28px", zIndex: 500, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, minWidth: 240 };

  return (
    <div style={panelStyle}>
      {/* Header */}
      {!fullscreen && (
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#333" }}>⏱️ Temporizador</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 20 }}>×</button>
        </div>
      )}

      {/* Ring */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={radius * 2 + stroke * 2} height={radius * 2 + stroke * 2} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={radius + stroke} cy={radius + stroke} r={radius} fill="none"
            stroke={fullscreen ? "#ffffff22" : "#f0f0f8"} strokeWidth={stroke} />
          <circle cx={radius + stroke} cy={radius + stroke} r={radius} fill="none"
            stroke={finished ? "#ff4d4d" : urgent ? "#ff6b35" : "#6965db"}
            strokeWidth={stroke} strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }} />
        </svg>
        <div style={{ position: "absolute", textAlign: "center" }}>
          <div style={{
            fontSize: fullscreen ? 96 : 42, fontWeight: 800,
            color: fullscreen ? "#fff" : finished ? "#ff4d4d" : urgent ? "#ff6b35" : "#333",
            fontVariantNumeric: "tabular-nums", lineHeight: 1,
            animation: urgent && running ? "pulse 1s ease-in-out infinite" : finished ? "pulse 0.5s ease-in-out infinite" : "none",
          }}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
          {finished && <div style={{ fontSize: fullscreen ? 28 : 14, color: "#ff4d4d", fontWeight: 700, marginTop: 8 }}>¡Tiempo!</div>}
        </div>
      </div>

      {/* Input row — only when stopped */}
      {!running && !finished && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="number" min={0} max={99} value={inputMin}
            onChange={(e) => setInputMin(e.target.value)}
            style={{ width: 60, textAlign: "center", fontSize: fullscreen ? 24 : 16, fontWeight: 700, border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "4px 8px", color: fullscreen ? "#fff" : "#333", background: fullscreen ? "#ffffff22" : "#fff" }} />
          <span style={{ color: fullscreen ? "#fff" : "#666", fontWeight: 600 }}>min</span>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 10 }}>
        {!running && !finished && (
          <button onClick={start} style={{ background: "#6965db", color: "#fff", border: "none", borderRadius: 10, padding: fullscreen ? "14px 40px" : "8px 22px", fontSize: fullscreen ? 22 : 14, fontWeight: 700, cursor: "pointer" }}>
            ▶ Iniciar
          </button>
        )}
        {running && (
          <button onClick={() => setRunning(false)} style={{ background: "#ff6b35", color: "#fff", border: "none", borderRadius: 10, padding: fullscreen ? "14px 40px" : "8px 22px", fontSize: fullscreen ? 22 : 14, fontWeight: 700, cursor: "pointer" }}>
            ⏸ Pausar
          </button>
        )}
        {!running && remaining < totalSecs && remaining > 0 && (
          <button onClick={() => setRunning(true)} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: fullscreen ? "14px 40px" : "8px 22px", fontSize: fullscreen ? 22 : 14, fontWeight: 700, cursor: "pointer" }}>
            ▶ Continuar
          </button>
        )}
        {(running || finished || remaining < totalSecs) && (
          <button onClick={reset} style={{ background: fullscreen ? "#ffffff22" : "#f5f5f5", color: fullscreen ? "#fff" : "#666", border: "none", borderRadius: 10, padding: fullscreen ? "14px 30px" : "8px 16px", fontSize: fullscreen ? 22 : 14, fontWeight: 700, cursor: "pointer" }}>
            ↺
          </button>
        )}
      </div>

      {/* Fullscreen toggle */}
      <button onClick={() => setFullscreen((v) => !v)}
        style={{ background: "none", border: `1.5px solid ${fullscreen ? "#ffffff44" : "#e0e0e0"}`, borderRadius: 8, padding: "5px 14px", fontSize: 12, color: fullscreen ? "#aaa" : "#888", cursor: "pointer", fontWeight: 600 }}>
        {fullscreen ? "⊠ Salir de pantalla completa" : "⛶ Pantalla completa"}
      </button>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
};
