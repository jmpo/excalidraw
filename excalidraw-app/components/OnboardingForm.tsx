import { useState } from "react";
import { completeOnboarding } from "../data/supabase";
import { useAuth } from "../auth/AuthContext";

const INDUSTRIES = [
  "Educación", "Diseño / UX", "Arquitectura / Ingeniería",
  "Marketing / Publicidad", "Desarrollo de software", "Consultoría",
  "Salud", "Otro",
];

const USE_CASES = [
  "Diagramas y flujos", "Presentaciones", "Mapas mentales",
  "Wireframes / Mockups", "Clases y material educativo",
  "Notas visuales", "Otro",
];

export const OnboardingForm = ({ onDone }: { onDone: () => void }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    industry: "",
    use_case: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.industry || !form.use_case) {
      setError("Completá todos los campos obligatorios.");
      return;
    }
    setSaving(true);
    try {
      await completeOnboarding(user!.id, form);
      onDone();
    } catch (err: any) {
      setError(err.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Assistant, system-ui, sans-serif",
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "40px 44px",
          width: 520,
          maxWidth: "100%",
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#f0eeff",
              borderRadius: 50,
              padding: "6px 16px",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 16 }}>🎉</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#6128ff" }}>
              ¡Cuenta creada!
            </span>
          </div>
          <h2
            style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "#1a1a2e" }}
          >
            Contanos sobre vos
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: "#888", lineHeight: 1.5 }}>
            Nos ayuda a mejorar EduDraw para tu caso de uso.
            <br />
            <strong style={{ color: "#6128ff" }}>
              Activás 7 días de prueba gratuita al completarlo.
            </strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nombre */}
          <label style={labelStyle}>
            Nombre completo <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <input
            type="text"
            placeholder="Tu nombre"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            style={inputStyle}
          />

          {/* Teléfono */}
          <label style={labelStyle}>Teléfono / WhatsApp (opcional)</label>
          <input
            type="tel"
            placeholder="+54 9 11 1234-5678"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            style={inputStyle}
          />

          {/* Industria */}
          <label style={labelStyle}>
            ¿En qué industria trabajás? <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <div style={chipGroupStyle}>
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                type="button"
                onClick={() => set("industry", ind)}
                style={chipStyle(form.industry === ind)}
              >
                {ind}
              </button>
            ))}
          </div>

          {/* Uso */}
          <label style={{ ...labelStyle, marginTop: 16 }}>
            ¿Para qué usarás EduDraw? <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <div style={chipGroupStyle}>
            {USE_CASES.map((uc) => (
              <button
                key={uc}
                type="button"
                onClick={() => set("use_case", uc)}
                style={chipStyle(form.use_case === uc)}
              >
                {uc}
              </button>
            ))}
          </div>

          {error && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                background: "#fff0f0",
                borderRadius: 8,
                fontSize: 13,
                color: "#e53e3e",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 24,
              width: "100%",
              padding: "14px",
              background: saving ? "#ccc" : "linear-gradient(94deg, #4a0fcc, #6128ff)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 800,
              cursor: saving ? "not-allowed" : "pointer",
              letterSpacing: 0.3,
            }}
          >
            {saving ? "Activando..." : "Activar 7 días gratis →"}
          </button>

          <p style={{ textAlign: "center", fontSize: 11, color: "#bbb", marginTop: 12 }}>
            Sin tarjeta de crédito. Podés cancelar cuando quieras.
          </p>
        </form>
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 700,
  color: "#444",
  marginBottom: 8,
  marginTop: 16,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  fontSize: 14,
  border: "1.5px solid #e0e0f0",
  borderRadius: 9,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  color: "#222",
};

const chipGroupStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: "6px 14px",
  borderRadius: 20,
  border: `1.5px solid ${active ? "#6128ff" : "#e0e0f0"}`,
  background: active ? "#f0eeff" : "#fafafa",
  color: active ? "#6128ff" : "#555",
  fontSize: 13,
  fontWeight: active ? 700 : 400,
  cursor: "pointer",
  transition: "all 0.12s",
});
