import { useState } from "react";

import { signInWithEmail, signUpWithEmail, resetPasswordForEmail } from "../data/supabase";

import "./LoginScreen.scss";

export const LoginScreen = ({ initialMode = "login" }: { initialMode?: "login" | "signup" }) => {
  const [mode, setMode] = useState<"login" | "signup" | "reset">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (next: "login" | "signup" | "reset") => {
    setMode(next);
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "reset") {
        const { error } = await resetPasswordForEmail(email);
        if (error) throw error;
        setMessage("✅ Te enviamos un link para restablecer tu contraseña. Revisá tu correo.");
      } else if (mode === "login") {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) throw error;
        setMessage("Revisá tu correo para confirmar tu cuenta.");
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <svg viewBox="0 0 28 28" fill="none" width="36" height="36">
            <rect width="28" height="28" rx="8" fill="#6128ff" />
            <path d="M6 20L11 13L15 17L22 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>EduDraw</span>
        </div>

        <h1>
          {mode === "login" ? "Iniciar sesión"
            : mode === "signup" ? "Crear cuenta"
            : "Recuperar contraseña"}
        </h1>

        {mode === "reset" && (
          <p style={{ fontSize: 14, color: "#666", marginBottom: 16, lineHeight: 1.5 }}>
            Ingresá tu email y te enviamos un link para crear una nueva contraseña.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoFocus
            />
          </label>

          {mode !== "reset" && (
            <label>
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mín. 8 caracteres"
                required
                minLength={8}
              />
            </label>
          )}

          {mode === "login" && (
            <div style={{ textAlign: "right", marginTop: -8, marginBottom: 8 }}>
              <button
                type="button"
                className="login-btn-toggle"
                style={{ fontSize: 12, padding: 0 }}
                onClick={() => switchMode("reset")}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {error && <p className="login-error">{error}</p>}
          {message && <p className="login-message">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="login-btn-primary"
          >
            {loading ? "Cargando..."
              : mode === "login" ? "Entrar"
              : mode === "signup" ? "Registrarme"
              : "Enviar link de recuperación"}
          </button>
        </form>

        {mode !== "reset" ? (
          <button
            className="login-btn-toggle"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login"
              ? "¿No tienes cuenta? Regístrate"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        ) : (
          <button
            className="login-btn-toggle"
            onClick={() => switchMode("login")}
          >
            ← Volver al inicio de sesión
          </button>
        )}
      </div>
    </div>
  );
};
