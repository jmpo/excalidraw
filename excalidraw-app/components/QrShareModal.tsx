import { useEffect, useState } from "react";
import { encode } from "uqr";
import { generateShareLink } from "../data/supabase";

const QrSvg = ({ url, size = 200 }: { url: string; size?: number }) => {
  const qr = encode(url);
  const cell = Math.floor(size / qr.size);
  const actual = cell * qr.size;
  return (
    <svg
      width={actual}
      height={actual}
      viewBox={`0 0 ${actual} ${actual}`}
      style={{ display: "block", borderRadius: 8 }}
    >
      <rect width={actual} height={actual} fill="#fff" />
      {qr.rows.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect
              key={`${x}-${y}`}
              x={x * cell}
              y={y * cell}
              width={cell}
              height={cell}
              fill="#1a1a2e"
            />
          ) : null,
        ),
      )}
    </svg>
  );
};

export const QrShareModal = ({
  drawingId,
  drawingName,
  onClose,
}: {
  drawingId: string;
  drawingName?: string;
  onClose: () => void;
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateShareLink(drawingId)
      .then(setUrl)
      .catch(() => setUrl(null))
      .finally(() => setLoading(false));
  }, [drawingId]);

  const handleCopy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    if (!url) return;
    const svg = document.querySelector("#qr-svg-export") as SVGSVGElement;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${drawingName ?? drawingId}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, padding: "32px 28px",
          maxWidth: 400, width: "100%", textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>
          Compartir con QR
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: "#888" }}>
          Proyectá este código en clase — los alumnos escanean y acceden al dibujo
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          {loading && (
            <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 13 }}>
              Generando link…
            </div>
          )}
          {!loading && url && (
            <div id="qr-svg-export">
              <QrSvg url={url} size={200} />
            </div>
          )}
          {!loading && !url && (
            <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#e53e3e", fontSize: 13 }}>
              Error al generar el link
            </div>
          )}
        </div>

        {url && (
          <>
            <div style={{
              background: "#f5f4ff", border: "1px solid #e0dfff", borderRadius: 8,
              padding: "8px 12px", fontSize: 12, color: "#555", wordBreak: "break-all",
              marginBottom: 16, textAlign: "left",
            }}>
              {url}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
              <button
                onClick={handleCopy}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, border: "1.5px solid #6128ff",
                  background: copied ? "#6128ff" : "#fff", color: copied ? "#fff" : "#6128ff",
                  fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all .15s",
                }}
              >
                {copied ? "✓ Copiado" : "Copiar link"}
              </button>
              <button
                onClick={handleDownload}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, border: "1.5px solid #ccc",
                  background: "#fff", color: "#333", fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}
              >
                ↓ Bajar QR
              </button>
            </div>
          </>
        )}

        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
            background: "#f5f4ff", color: "#6128ff", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
