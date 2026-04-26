import { useState } from "react";
import { randomId } from "@excalidraw/common";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

// ── YouTube / Video URL helpers ───────────────────────────────────────────────

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/v\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const getYouTubeThumbnail = (videoId: string) =>
  `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

const getYouTubeWatchUrl = (videoId: string) =>
  `https://www.youtube.com/watch?v=${videoId}`;

// Build a composite PNG: thumbnail + play button overlay
const buildVideoImageDataURL = async (
  thumbnailUrl: string,
  title: string,
): Promise<string | null> => {
  try {
    const W = 640;
    const H = 360;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Draw thumbnail via proxy-free approach (same domain image)
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("thumbnail_failed"));
      img.src = thumbnailUrl;
    });
    ctx.drawImage(img, 0, 0, W, H);

    // Dark overlay
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, W, H);

    // Play button circle
    const cx = W / 2, cy = H / 2, r = 48;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fill();

    // Play triangle
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 20);
    ctx.lineTo(cx - 14, cy + 20);
    ctx.lineTo(cx + 22, cy);
    ctx.closePath();
    ctx.fillStyle = "#e52d27";
    ctx.fill();

    // Title bar at bottom
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, H - 52, W, 52);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px -apple-system, sans-serif";
    ctx.fillText("▶ " + title.slice(0, 70), 16, H - 22);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText("Clic para abrir en YouTube", 16, H - 6);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
};

// Fallback: create a styled placeholder without thumbnail fetch
const buildFallbackDataURL = (title: string): string => {
  const W = 640, H = 360;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#1a1a2e");
  grad.addColorStop(1, "#16213e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Play button
  const cx = W / 2, cy = H / 2 - 20, r = 52;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#e52d27";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy - 22);
  ctx.lineTo(cx - 16, cy + 22);
  ctx.lineTo(cx + 24, cy);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();

  // Title
  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title.slice(0, 50) || "Video de YouTube", cx, cy + r + 36);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "13px -apple-system, sans-serif";
  ctx.fillText("📹 Clic para abrir el video", cx, cy + r + 58);

  return canvas.toDataURL("image/png");
};

// ── Component ────────────────────────────────────────────────────────────────

export const VideoEmbed = ({
  excalidrawAPI,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [inserting, setInserting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ videoId: string; thumb: string } | null>(null);

  const handleUrlChange = (val: string) => {
    setUrl(val);
    setError("");
    const vid = extractYouTubeId(val);
    if (vid) {
      setPreview({ videoId: vid, thumb: getYouTubeThumbnail(vid) });
    } else {
      setPreview(null);
    }
  };

  const handleInsert = async () => {
    if (!excalidrawAPI) return;
    if (!url.trim()) { setError("Ingresá una URL de YouTube."); return; }
    const videoId = extractYouTubeId(url);
    if (!videoId) { setError("No se reconoció como URL de YouTube. Ejemplo: https://youtu.be/abc123"); return; }

    setInserting(true);
    setError("");
    try {
      const watchUrl = getYouTubeWatchUrl(videoId);
      const thumbUrl = getYouTubeThumbnail(videoId);

      // Try to load thumbnail, fall back to placeholder
      let dataURL = await buildVideoImageDataURL(thumbUrl, url);
      if (!dataURL) dataURL = buildFallbackDataURL(url);

      const fileId = randomId() as any;
      const W = 640, H = 360;
      const appState = excalidrawAPI.getAppState();
      const cx = appState.width / 2 / appState.zoom.value - appState.scrollX;
      const cy = appState.height / 2 / appState.zoom.value - appState.scrollY;

      excalidrawAPI.addFiles([{
        id: fileId,
        dataURL: dataURL as any,
        mimeType: "image/png" as const,
        created: Date.now(),
      }]);

      const imageEl: any = {
        type: "image",
        id: randomId(),
        x: cx - W / 2,
        y: cy - H / 2,
        width: W,
        height: H,
        angle: 0,
        strokeColor: "transparent",
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: null,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 100000),
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: watchUrl,   // ← click opens YouTube!
        locked: false,
        fileId,
        status: "loaded",
        scale: [1, 1],
        index: null,
      };

      excalidrawAPI.updateScene({
        elements: [...excalidrawAPI.getSceneElements(), imageEl],
      });

      setOpen(false);
      setUrl("");
      setPreview(null);
    } catch (e: any) {
      setError(e?.message ?? "Error al insertar el video.");
    } finally {
      setInserting(false);
    }
  };

  return (
    <>
      {/* Toolbar button */}
      <button
        onClick={() => setOpen(true)}
        title="Insertar video de YouTube en el pizarrón"
        style={{
          padding: "6px 12px", background: "#fff", color: "#333",
          border: "1.5px solid #ccc", borderRadius: 6,
          fontSize: 13, fontWeight: 600, cursor: "pointer", marginRight: 8,
        }}
      >
        📹 Video
      </button>

      {/* Modal */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(10,5,30,0.55)",
            zIndex: 9999, display: "flex", alignItems: "center",
            justifyContent: "center", padding: 16,
            fontFamily: "Assistant, system-ui, sans-serif",
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !inserting) { setOpen(false); setUrl(""); setPreview(null); setError(""); } }}
        >
          <div style={{
            background: "#fff", borderRadius: 20, width: 520, maxWidth: "100%",
            boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{ padding: "22px 24px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>📹 Insertar video</div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                  Se inserta como imagen con link — clic abre YouTube
                </div>
              </div>
              <button
                onClick={() => { if (!inserting) { setOpen(false); setUrl(""); setPreview(null); setError(""); } }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 22, lineHeight: 1, padding: "2px 4px" }}>×</button>
            </div>

            {/* URL input */}
            <div style={{ padding: "16px 24px 0" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>
                URL de YouTube
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleInsert(); }}
                placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                autoFocus
                style={{
                  width: "100%", padding: "10px 12px",
                  border: `1.5px solid ${error ? "#f87171" : "#e0e0e0"}`,
                  borderRadius: 9, fontSize: 14,
                  outline: "none", color: "#333", boxSizing: "border-box",
                }}
              />
              {error && (
                <div style={{ fontSize: 12, color: "#ef4444", marginTop: 5 }}>⚠ {error}</div>
              )}
            </div>

            {/* Quick examples */}
            <div style={{ padding: "10px 24px 0" }}>
              <span style={{ fontSize: 11, color: "#aaa" }}>Ejemplos: </span>
              {["youtu.be/dQw4w9WgXcQ", "youtube.com/watch?v=..."].map((ex) => (
                <button key={ex} onClick={() => handleUrlChange(`https://${ex}`)}
                  style={{ background: "none", border: "none", color: "#6965db",
                    fontSize: 11, cursor: "pointer", textDecoration: "underline", padding: "0 4px" }}>
                  {ex}
                </button>
              ))}
            </div>

            {/* Thumbnail preview */}
            {preview && (
              <div style={{ margin: "12px 24px 0", borderRadius: 10, overflow: "hidden",
                border: "1.5px solid #e0e0e0", background: "#000", aspectRatio: "16/9" }}>
                <img
                  src={preview.thumb}
                  alt="thumbnail"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}

            {/* Info */}
            <div style={{ margin: "12px 24px 0", padding: "10px 14px",
              background: "#f8f7ff", borderRadius: 9, fontSize: 12, color: "#555", lineHeight: 1.5 }}>
              💡 El video se inserta como una imagen en el pizarrón. En <strong>modo presentación</strong>, hacer clic en la imagen abre el video en YouTube.
            </div>

            {/* Actions */}
            <div style={{ padding: "16px 24px 22px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => { if (!inserting) { setOpen(false); setUrl(""); setPreview(null); setError(""); } }}
                disabled={inserting}
                style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e0e0e0",
                  background: "none", fontSize: 13, cursor: "pointer", color: "#666" }}>
                Cancelar
              </button>
              <button
                onClick={handleInsert}
                disabled={inserting || !url.trim()}
                style={{
                  padding: "9px 22px", borderRadius: 8, border: "none",
                  background: inserting || !url.trim() ? "#ccc" : "linear-gradient(135deg,#e52d27,#c0392b)",
                  fontSize: 13, fontWeight: 700,
                  cursor: inserting || !url.trim() ? "not-allowed" : "pointer",
                  color: "#fff", boxShadow: "0 2px 8px rgba(229,45,39,.3)",
                }}>
                {inserting ? "Insertando…" : "📹 Insertar video"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
