import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  drawingId: string;
  initialContent?: string;
  onBack: () => void;
  onSave: (content: string) => void;
}

const TEMPLATES: { label: string; icon: string; code: string }[] = [
  {
    label: "Flujo",
    icon: "🔀",
    code: `flowchart TD
    A([Inicio]) --> B[Proceso 1]
    B --> C{¿Decisión?}
    C -->|Sí| D[Resultado A]
    C -->|No| E[Resultado B]
    D --> F([Fin])
    E --> F`,
  },
  {
    label: "Secuencia",
    icon: "↔️",
    code: `sequenceDiagram
    participant A as Alumno
    participant P as Profesor
    participant S as Sistema
    A->>P: Hace pregunta
    P->>S: Consulta recursos
    S-->>P: Devuelve info
    P-->>A: Responde`,
  },
  {
    label: "Clases",
    icon: "🏗️",
    code: `classDiagram
    class Animal {
      +String nombre
      +int edad
      +hacerSonido()
    }
    class Perro {
      +String raza
      +ladrar()
    }
    class Gato {
      +ronronear()
    }
    Animal <|-- Perro
    Animal <|-- Gato`,
  },
  {
    label: "Gantt",
    icon: "📅",
    code: `gantt
    title Planificación del curso
    dateFormat  YYYY-MM-DD
    section Unidad 1
    Introducción      :a1, 2025-03-01, 7d
    Práctica          :a2, after a1, 7d
    section Unidad 2
    Teoría            :b1, after a2, 10d
    Evaluación        :b2, after b1, 3d`,
  },
  {
    label: "ER",
    icon: "🗄️",
    code: `erDiagram
    ESTUDIANTE {
        int id PK
        string nombre
        string email
    }
    CURSO {
        int id PK
        string nombre
        string descripcion
    }
    INSCRIPCION {
        int estudianteId FK
        int cursoId FK
        date fecha
    }
    ESTUDIANTE ||--o{ INSCRIPCION : realiza
    CURSO ||--o{ INSCRIPCION : tiene`,
  },
  {
    label: "Mente",
    icon: "🧠",
    code: `mindmap
  root((Tema central))
    Idea A
      Detalle 1
      Detalle 2
    Idea B
      Detalle 3
    Idea C
      Detalle 4
      Detalle 5`,
  },
];

export const MermaidEditor = ({ drawingId: _id, initialContent, onBack, onSave }: Props) => {
  const [code, setCode] = useState(initialContent || TEMPLATES[0].code);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mermaidRef = useRef<any>(null);

  const render = useCallback(async (src: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!mermaidRef.current) {
        const m = await import("mermaid");
        mermaidRef.current = m.default;
        mermaidRef.current.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });
      }
      const id = `mermaid-${Date.now()}`;
      const { svg: out } = await mermaidRef.current.render(id, src);
      setSvg(out);
    } catch (e: any) {
      setError(e?.message ?? "Error en el diagrama");
      setSvg("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => render(code), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [code, render]);

  const exportSvg = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "diagrama.svg"; a.click();
    URL.revokeObjectURL(url);
  };

  const copySvg = async () => {
    await navigator.clipboard.writeText(svg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTemplateSelect = (i: number) => {
    setActiveTemplate(i);
    setCode(TEMPLATES[i].code);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f8f7ff", fontFamily: "Assistant, system-ui, sans-serif" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", background: "#fff", borderBottom: "1px solid #ede9fe", flexShrink: 0 }}>
        <button onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6965db", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}>
          ← Volver
        </button>
        <div style={{ width: 1, height: 20, background: "#eee" }} />
        <span style={{ fontWeight: 800, fontSize: 15, color: "#333" }}>📊 Editor de diagramas</span>

        {/* Templates */}
        <div style={{ display: "flex", gap: 4, marginLeft: 8, flexWrap: "wrap" }}>
          {TEMPLATES.map((t, i) => (
            <button key={i} onClick={() => handleTemplateSelect(i)}
              style={{ padding: "4px 10px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: activeTemplate === i ? "#6965db" : "#f0efff", color: activeTemplate === i ? "#fff" : "#6965db" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={copySvg} disabled={!svg}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #6965db", background: "#fff", color: "#6965db", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {copied ? "✓ Copiado" : "📋 Copiar SVG"}
          </button>
          <button onClick={exportSvg} disabled={!svg}
            style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#6965db", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            ⬇ Exportar SVG
          </button>
          <button onClick={() => onSave(code)}
            style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#6965db,#8b5cf6)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            💾 Guardar
          </button>
        </div>
      </div>

      {/* Main: editor + preview */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Code panel */}
        <div style={{ width: "42%", display: "flex", flexDirection: "column", borderRight: "1px solid #ede9fe" }}>
          <div style={{ padding: "8px 14px", background: "#faf9ff", borderBottom: "1px solid #ede9fe", fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: ".05em" }}>
            CÓDIGO MERMAID
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1, padding: "14px 16px", border: "none", outline: "none", resize: "none",
              fontFamily: "'Fira Code', 'Cascadia Code', monospace", fontSize: 13, lineHeight: 1.65,
              background: "#1e1e2e", color: "#cdd6f4", overflowY: "auto",
            }}
          />
        </div>

        {/* Preview panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "8px 14px", background: "#faf9ff", borderBottom: "1px solid #ede9fe", fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: ".05em", display: "flex", alignItems: "center", gap: 8 }}>
            VISTA PREVIA
            {loading && <span style={{ fontSize: 10, color: "#6965db", fontWeight: 600 }}>Actualizando…</span>}
          </div>
          <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#fff" }}>
            {error ? (
              <div style={{ background: "#fff5f5", border: "1.5px solid #fed7d7", borderRadius: 12, padding: "16px 20px", maxWidth: 420 }}>
                <div style={{ fontWeight: 700, color: "#c53030", marginBottom: 6 }}>⚠️ Error en el diagrama</div>
                <pre style={{ fontSize: 12, color: "#744210", margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{error}</pre>
              </div>
            ) : svg ? (
              <div dangerouslySetInnerHTML={{ __html: svg }}
                style={{ maxWidth: "100%", maxHeight: "100%" }} />
            ) : (
              <div style={{ color: "#bbb", fontSize: 14 }}>Escribí código Mermaid para ver el diagrama</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
