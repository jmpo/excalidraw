import { useState, useEffect, useRef } from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — katex types exist but don't resolve with current moduleResolution
import katex from "katex";
import "katex/dist/katex.min.css";
import { randomId } from "@excalidraw/common";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

// ── Formula → SVG data URL (sin canvas, evita taint por foreignObject) ────────

const FONT_SIZE = 28;
const PADDING = 24;

const buildFormulaDataURL = (latex: string): { dataURL: string; width: number; height: number } | null => {
  try {
    // Use KaTeX HTML output for the SVG foreignObject
    const html = katex.renderToString(latex, {
      throwOnError: true,
      displayMode: true,
      output: "html",
    });

    // Measure rendered size in a temporary off-screen element
    const measure = document.createElement("div");
    measure.style.cssText = `
      position: fixed; left: -9999px; top: -9999px;
      visibility: hidden; background: white;
      padding: ${PADDING}px; font-size: ${FONT_SIZE}px; line-height: 1.5;
    `;
    measure.innerHTML = html;
    document.body.appendChild(measure);
    const rect = measure.getBoundingClientRect();
    document.body.removeChild(measure);

    const W = Math.max(Math.ceil(rect.width) + PADDING * 2, 120);
    const H = Math.max(Math.ceil(rect.height) + PADDING * 2, 60);

    // Gather KaTeX CSS (strip @font-face to avoid cross-origin issues in canvas exports)
    let katexCss = "";
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = Array.from(sheet.cssRules ?? []);
        const hasKatex = rules.some((r) => r.cssText?.includes(".katex"));
        if (hasKatex) {
          katexCss = rules
            .filter((r) => !r.cssText?.startsWith("@font-face"))
            .map((r) => r.cssText)
            .join(" ");
          break;
        }
      } catch { /* cross-origin sheet — skip */ }
    }

    // Properly escape the KaTeX HTML for use inside SVG XML
    // We serialize through DOM to get valid XHTML
    const xhtmlWrapper = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    (xhtmlWrapper as HTMLElement).style.cssText = `padding:${PADDING}px;background:white;font-size:${FONT_SIZE}px;line-height:1.5;`;
    (xhtmlWrapper as HTMLElement).innerHTML = html;
    const xhtmlString = new XMLSerializer().serializeToString(xhtmlWrapper);

    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`,
      `<style>${katexCss}.katex{font-size:${FONT_SIZE}px}</style>`,
      `<rect width="${W}" height="${H}" fill="white"/>`,
      `<foreignObject x="0" y="0" width="${W}" height="${H}">`,
      xhtmlString,
      `</foreignObject>`,
      `</svg>`,
    ].join("");

    // Use base64 data URI so there's no Blob URL cross-origin issue
    const dataURL = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
    return { dataURL, width: W, height: H };
  } catch {
    return null;
  }
};

// ── Examples ─────────────────────────────────────────────────────────────────

const EXAMPLES = [
  { label: "Pitágoras",   formula: "c = \\sqrt{a^2 + b^2}" },
  { label: "Cuadrática",  formula: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" },
  { label: "Euler",       formula: "e^{i\\pi} + 1 = 0" },
  { label: "Integral",    formula: "\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}" },
  { label: "Sumatoria",   formula: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}" },
  { label: "Derivada",    formula: "\\frac{d}{dx}\\left(\\frac{f}{g}\\right) = \\frac{f'g - fg'}{g^2}" },
  { label: "Vector",      formula: "\\vec{F} = m\\vec{a}" },
  { label: "Logaritmo",   formula: "\\log_b x = \\frac{\\ln x}{\\ln b}" },
];

// ── Main component ────────────────────────────────────────────────────────────

export const MathFormulaInserter = ({
  excalidrawAPI,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}) => {
  const [open, setOpen] = useState(false);
  const [latex, setLatex] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [inserting, setInserting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Live preview
  useEffect(() => {
    if (!latex.trim()) { setPreviewHtml(""); setPreviewError(""); return; }
    try {
      const html = katex.renderToString(latex, {
        throwOnError: true,
        displayMode: true,
        output: "html",
      });
      setPreviewHtml(html);
      setPreviewError("");
    } catch (e: any) {
      setPreviewHtml("");
      setPreviewError(e?.message ?? "Fórmula inválida");
    }
  }, [latex]);

  const handleInsert = () => {
    if (!excalidrawAPI || !latex.trim() || previewError) return;
    setInserting(true);
    try {
      const result = buildFormulaDataURL(latex);
      if (!result) throw new Error("No se pudo generar el SVG de la fórmula.");

      const fileId = randomId() as any;
      const fileData = {
        id: fileId,
        dataURL: result.dataURL as any,
        mimeType: "image/svg+xml" as const,
        created: Date.now(),
      };

      const appState = excalidrawAPI.getAppState();
      const cx = appState.width / 2 / appState.zoom.value - appState.scrollX;
      const cy = appState.height / 2 / appState.zoom.value - appState.scrollY;

      const imageEl: any = {
        type: "image",
        id: randomId(),
        x: cx - result.width / 2,
        y: cy - result.height / 2,
        width: result.width,
        height: result.height,
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
        link: null,
        locked: false,
        fileId,
        status: "loaded",
        scale: [1, 1],
        index: null,
      };

      excalidrawAPI.addFiles([fileData]);
      excalidrawAPI.updateScene({
        elements: [...excalidrawAPI.getSceneElements(), imageEl],
      });

      setOpen(false);
      setLatex("");
    } catch (e: any) {
      alert("Error al insertar: " + (e?.message ?? "Error desconocido"));
    } finally {
      setInserting(false);
    }
  };

  const close = () => { if (!inserting) { setOpen(false); setPreviewError(""); } };

  return (
    <>
      {/* Toolbar button */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => textareaRef.current?.focus(), 50); }}
        title="Insertar fórmula matemática (KaTeX / LaTeX)"
        style={{
          padding: "6px 12px", background: "#fff", color: "#333",
          border: "1.5px solid #ccc", borderRadius: 6,
          fontSize: 14, fontWeight: 700, cursor: "pointer", marginRight: 8,
        }}
      >
        ∑ Fórmula
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
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div style={{
            background: "#fff", borderRadius: 20, width: 560, maxWidth: "100%",
            maxHeight: "90vh", overflow: "auto",
            boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
            display: "flex", flexDirection: "column",
          }}>
            {/* Header */}
            <div style={{ padding: "22px 24px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>∑ Fórmula matemática</div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                  Escribí LaTeX — se inserta como imagen en el pizarrón
                </div>
              </div>
              <button onClick={close}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 22, lineHeight: 1, padding: "2px 4px" }}>×</button>
            </div>

            {/* Examples */}
            <div style={{ padding: "14px 24px 0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6965db", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>
                Ejemplos rápidos
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {EXAMPLES.map(({ label, formula }) => (
                  <button key={label} onClick={() => setLatex(formula)}
                    style={{
                      background: "#f8f7ff", border: "1px solid #e0deff",
                      borderRadius: 7, padding: "4px 10px", fontSize: 12,
                      cursor: "pointer", color: "#5551c4", fontWeight: 600,
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div style={{ padding: "12px 24px 0" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>
                LaTeX
              </label>
              <textarea
                ref={textareaRef}
                value={latex}
                onChange={(e) => setLatex(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleInsert(); }}
                placeholder={"\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"}
                rows={3}
                style={{
                  width: "100%", padding: "10px 12px",
                  border: `1.5px solid ${previewError ? "#f87171" : "#e0deff"}`,
                  borderRadius: 9, fontSize: 14, fontFamily: "monospace",
                  resize: "vertical", outline: "none", lineHeight: 1.5,
                  color: "#333", boxSizing: "border-box",
                }}
              />
              <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>Ctrl+Enter para insertar rápido</div>
            </div>

            {/* Preview */}
            <div style={{
              margin: "10px 24px 0", minHeight: 80, background: "#fafafe",
              border: `1.5px solid ${previewError ? "#fca5a5" : "#e8e6ff"}`,
              borderRadius: 10, padding: "12px 16px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {previewError ? (
                <span style={{ fontSize: 12, color: "#ef4444" }}>⚠ {previewError}</span>
              ) : previewHtml ? (
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} style={{ fontSize: FONT_SIZE }} />
              ) : (
                <span style={{ fontSize: 12, color: "#bbb" }}>La fórmula aparecerá aquí en tiempo real</span>
              )}
            </div>

            {/* Actions */}
            <div style={{ padding: "16px 24px 22px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={close}
                style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e0e0e0",
                  background: "none", fontSize: 13, cursor: "pointer", color: "#666" }}>
                Cancelar
              </button>
              <button
                onClick={handleInsert}
                disabled={inserting || !latex.trim() || !!previewError}
                style={{
                  padding: "9px 22px", borderRadius: 8, border: "none",
                  background: (inserting || !latex.trim() || previewError)
                    ? "#ccc" : "linear-gradient(135deg,#6965db,#4f46e5)",
                  fontSize: 13, fontWeight: 700,
                  cursor: (inserting || !latex.trim() || previewError) ? "not-allowed" : "pointer",
                  color: "#fff", boxShadow: "0 2px 8px rgba(99,89,219,.3)",
                }}>
                {inserting ? "Insertando…" : "⬇ Insertar en pizarrón"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
