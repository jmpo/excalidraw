import { useState } from "react";

import { signInWithEmail, signUpWithEmail } from "../data/supabase";

import "./LoginScreen.scss";

export const LoginScreen = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          throw error;
        }
        setMessage("Revisa tu correo para confirmar tu cuenta.");
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
          <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
            <path
              d="M3 17L9 11L13 15L21 7"
              stroke="#6965db"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Excalidraw</span>
        </div>

        <h1>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>

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

          {error && <p className="login-error">{error}</p>}
          {message && <p className="login-message">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="login-btn-primary"
          >
            {loading
              ? "Cargando..."
              : mode === "login"
              ? "Entrar"
              : "Registrarme"}
          </button>
        </form>

        <button
          className="login-btn-toggle"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
            setMessage("");
          }}
        >
          {mode === "login"
            ? "¿No tienes cuenta? Regístrate"
            : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>
    </div>
  );
};
