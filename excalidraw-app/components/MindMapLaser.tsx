import { useEffect, useRef } from "react";

interface Props {
  active: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const FADE_MS = 800;

export const MindMapLaser = ({ active, containerRef }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{ x: number; y: number; t: number }[]>([]);
  const rafRef = useRef<number>(0);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Size canvas to match container
    const sync = () => {
      const r = container.getBoundingClientRect();
      canvas.width = r.width;
      canvas.height = r.height;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(container);

    // RAF draw loop — always running while mounted so fade works after release
    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!active) return;

      const now = Date.now();
      if (!drawingRef.current) {
        pointsRef.current = pointsRef.current.filter((p) => now - p.t < FADE_MS);
      }

      const pts = pointsRef.current;
      if (pts.length < 2) return;

      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1];
        const p1 = pts[i];
        const age = drawingRef.current ? 0 : now - p1.t;
        const alpha = Math.max(0, 1 - age / FADE_MS);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = `rgba(255,40,40,${alpha * 0.9})`;
        ctx.lineWidth = Math.max(1, 5 * alpha);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }

      // Glowing tip while drawing
      if (drawingRef.current && pts.length > 0) {
        const { x, y } = pts[pts.length - 1];
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,40,40,0.15)"; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,40,40,0.75)"; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#fff"; ctx.fill();
      }
    };
    rafRef.current = requestAnimationFrame(draw);

    // Pointer handlers — attached to the container so they work over Mind Elixir nodes too
    const pos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: PointerEvent) => {
      drawingRef.current = true;
      pointsRef.current = [{ ...pos(e), t: Date.now() }];
      // Capture so we keep getting events even if pointer leaves container
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      pointsRef.current.push({ ...pos(e), t: Date.now() });
    };
    const onUp = () => { drawingRef.current = false; };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [active, containerRef]);

  // Clear trail when deactivated
  useEffect(() => {
    if (!active) {
      pointsRef.current = [];
      drawingRef.current = false;
    }
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        zIndex: 20,
        cursor: "crosshair",
      }}
    />
  );
};
