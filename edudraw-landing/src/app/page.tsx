"use client";

import React, { useEffect, useRef, useState } from "react";
import { signUpWithEmail } from "@/lib/supabase";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.edudraw.chatea.click";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function fbq(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

const pixelViewContent = (name: string) => fbq("track", "ViewContent", { content_name: name });
const pixelLead = (email: string) => fbq("track", "Lead", { email });
const pixelRegistration = (email: string) => fbq("track", "CompleteRegistration", { email });
const pixelAddToCart = () => fbq("track", "AddToCart");

const cdnOpt = (url: string, w = 1200) =>
  url.replace("/upload/", `/upload/f_auto,q_auto,w_${w}/`);

const SCREENSHOT_WHITEBOARD =
  "https://res.cloudinary.com/dkny2qqeu/image/upload/v1776703746/hf_20260420_162838_d64ad83e-86f0-4746-8730-aed1620dce67_qkks1j.png";
const SCREENSHOT_MINDMAP =
  "https://res.cloudinary.com/dkny2qqeu/image/upload/v1776703745/hf_20260420_164353_f88124b6-426d-4a34-b40c-794f75ad269d_udlq3f.png";

const BrowserFrame = ({
  url,
  src,
  alt,
  eager,
}: {
  url: string;
  src: string;
  alt: string;
  eager?: boolean;
}) => (
  <div className="lp-hero-preview-frame" style={{ flex: 1, minWidth: 0 }}>
    <div className="lp-hero-preview-bar">
      <div className="lp-hero-preview-dots">
        <div className="lp-hero-preview-dot" style={{ background: "#ff5f57" }} />
        <div className="lp-hero-preview-dot" style={{ background: "#febc2e" }} />
        <div className="lp-hero-preview-dot" style={{ background: "#28c840" }} />
      </div>
      <div className="lp-hero-preview-url">{url}</div>
    </div>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={cdnOpt(src)}
      alt={alt}
      width={580}
      height={340}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : undefined}
    />
  </div>
);

const HeroPreview = () => (
  <div className="lp-hero-preview">
    <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
      <BrowserFrame
        url="edudraw.app — Pizarra libre 🎨"
        src={SCREENSHOT_WHITEBOARD}
        alt="EduDraw pizarra libre"
        eager
      />
      <BrowserFrame
        url="edudraw.app — Mapa mental 🧠"
        src={SCREENSHOT_MINDMAP}
        alt="EduDraw mapa mental"
      />
    </div>
  </div>
);

export default function LandingPage() {
  const goSignup = () => {
    document.getElementById("registro")?.scrollIntoView({ behavior: "smooth" });
  };

  const goApp = () => {
    window.location.href = APP_URL;
  };

  const goGuest = () => {
    window.location.href = `${APP_URL}/?guest=1`;
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const leadFiredRef = useRef(false);

  const formReady =
    email.trim().length > 3 && email.includes("@") && password.length >= 8;

  useEffect(() => {
    pixelViewContent("Landing EduDraw");
  }, []);

  useEffect(() => {
    if (formReady && !leadFiredRef.current) {
      leadFiredRef.current = true;
      pixelLead(email);
    }
  }, [formReady, email]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    if (!leadFiredRef.current) {
      leadFiredRef.current = true;
      pixelLead(email);
    }
    try {
      const { data, error } = await signUpWithEmail(email, password);
      if (error) throw error;
      pixelRegistration(email);
      if (data.session) {
        const { access_token, refresh_token } = data.session;
        window.location.href = `${APP_URL}/#access_token=${access_token}&refresh_token=${refresh_token}&type=signup`;
      } else {
        window.location.href = APP_URL;
      }
    } catch (err: unknown) {
      pixelLead(email);
      const msg = err instanceof Error ? err.message : "Ocurrió un error.";
      setFormError(msg);
      setFormLoading(false);
    }
  };

  return (
    <div className="lp">
      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#6128ff" />
            <path
              d="M6 20L11 13L15 17L22 9"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          EduDraw
        </div>
        <div className="lp-nav-links">
          <a href="#herramientas">Herramientas</a>
          <a href="#plantillas">Plantillas</a>
          <a href="#como-funciona">¿Cómo funciona?</a>
          <a href="#precios">Precios</a>
        </div>
        <div className="lp-nav-btns">
          <button
            className="lp-btn lp-btn-ghost"
            style={{ fontSize: 14, padding: "8px 18px" }}
            onClick={goApp}
          >
            Iniciar sesión
          </button>
          <button
            className="lp-btn lp-btn-primary"
            style={{ fontSize: 14, padding: "8px 18px" }}
            onClick={goSignup}
          >
            Empezar gratis →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-badge lp-fadein">
          ✨ Ahora con IA integrada &nbsp;·&nbsp; Pizarra + Mapas Mentales + Inteligencia Artificial
        </div>
        <h1 className="lp-fadein-2">
          Deja de perder horas armando clases:<br />
          <span className="lp-mark">crea clases visuales y organizadas</span>
          <br />
          en minutos desde un solo lugar
        </h1>
        <p className="lp-hero-sub lp-fadein-3">
          Ahora con IA integrada para resumir, organizar y transformar tus ideas automáticamente.
          <br />
          Diseñado para profesores y creadores de cursos que quieren enseñar mejor sin perder tiempo
          ni usar múltiples herramientas.
        </p>
        <div className="lp-hero-btns lp-fadein-3">
          <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={goSignup}>
            🚀 Crear mi primera clase ahora (gratis)
          </button>
          <button className="lp-btn lp-btn-ghost lp-btn-lg" onClick={goGuest}>
            Ver cómo funciona →
          </button>
        </div>
        <p className="lp-hero-note lp-fadein-4">
          7 días con acceso completo · Después el acceso se limita · Sin tarjeta de crédito
        </p>

        <div className="lp-social-bar lp-fadein-4">
          <div className="lp-social-item">⭐ 4.9 / 5 en reseñas</div>
          <div className="lp-social-dot" />
          <div className="lp-social-item">🏫 Más de 500 docentes</div>
          <div className="lp-social-dot" />
          <div className="lp-social-item">🌎 Argentina · México · Colombia</div>
        </div>

        <HeroPreview />
      </section>

      {/* ── PAIN → GAIN ── */}
      <div
        style={{
          background: "linear-gradient(180deg,#fafafe 0%,#fff 100%)",
          borderTop: "1.5px solid #f0f0f8",
        }}
      >
        <div className="lp-pain">
          <div className="lp-section-header">
            <div className="lp-section-tag">😩 El problema real</div>
            <h2
              style={{
                fontSize: "clamp(26px,3.2vw,44px)",
                fontWeight: 800,
                letterSpacing: "-.5px",
                color: "#0a0a18",
              }}
            >
              Si cada clase te toma más tiempo
              <br />
              del que debería…
            </h2>
            <div
              style={{
                maxWidth: 560,
                margin: "20px auto 0",
                background: "#fff8f8",
                border: "1.5px solid #fecaca",
                borderRadius: 16,
                padding: "24px 28px",
                textAlign: "left",
              }}
            >
              {[
                "Pasas más tiempo organizando que enseñando",
                "Saltás entre 3 o 5 herramientas para preparar una sola clase",
                "Tus ideas están, pero no lográs estructurarlas bien",
                "Terminás improvisando porque todo está disperso",
              ].map((t) => (
                <div
                  key={t}
                  style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}
                >
                  <span style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }}>✕</span>
                  <span style={{ fontSize: 15, color: "#555", lineHeight: 1.6 }}>{t}</span>
                </div>
              ))}
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid #fecaca",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#dc2626",
                }}
              >
                💥 Y lo peor: sabés que podrías hacerlo mejor… pero te toma demasiado tiempo.
              </div>
            </div>
          </div>
          <div className="lp-pain-grid" style={{ marginTop: 40 }}>
            <div className="lp-pain-before">
              <div className="lp-pain-label">
                <span style={{ fontSize: 18 }}>😩</span> Sin EduDraw
              </div>
              {[
                "Saltás entre Canva, Miro, Notion o PowerPoint",
                "Perdés tiempo organizando ideas antes de enseñar",
                "Tus clases no se ven tan claras como te gustaría",
                "Terminás improvisando porque todo está disperso",
                "Cada herramienta tiene su propia curva de aprendizaje",
                "Nunca encontrás lo que guardaste la semana pasada",
              ].map((t) => (
                <div key={t} className="lp-pain-item">
                  <span className="lp-pain-x">✕</span>
                  <span className="lp-pain-text">{t}</span>
                </div>
              ))}
            </div>
            <div className="lp-pain-after">
              <div className="lp-pain-label">
                <span style={{ fontSize: 18 }}>🎯</span> Con EduDraw
              </div>
              {[
                "Un solo lugar para mapas mentales y pizarra visual",
                "Organizás tus ideas en minutos, no en horas",
                "Clases claras y estructuradas desde el primer día",
                "Todo guardado en la nube — siempre listo para enseñar",
                "Sin curva de aprendizaje — empezás en segundos",
                "Dashboard limpio con todos tus documentos al instante",
              ].map((t) => (
                <div key={t} className="lp-pain-item">
                  <span className="lp-pain-check">✓</span>
                  <span className="lp-pain-text">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI SECTION ── */}
      <div className="lp-ai-section">
        <div className="lp-ai-inner">
          <div className="lp-ai-header">
            <div className="lp-ai-tag">✨ Inteligencia Artificial incluida</div>
            <h2
              style={{
                fontSize: "clamp(30px,3.8vw,52px)",
                fontWeight: 800,
                letterSpacing: "-.8px",
                color: "#fff",
                lineHeight: 1.1,
                margin: "0 auto 16px",
                maxWidth: 700,
              }}
            >
              Describí tu tema.
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg,#c4b5fd,#818cf8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                La IA crea la base de tu clase.
              </span>
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,.5)",
                maxWidth: 560,
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Menos tiempo pensando cómo organizar. Más tiempo enseñando.
            </p>
          </div>

          <div className="lp-ai-grid">
            {/* AI WHITEBOARD */}
            <div className="lp-ai-card">
              <div className="lp-ai-card-badge">✨ IA Pizarra</div>
              <h3>Pegá texto o un PDF → Pizarrón visual listo</h3>
              <p>
                La IA resume automáticamente tu contenido y lo organiza en tarjetas visuales
                estructuradas sobre el canvas, listas para enseñar.
              </p>
              <div className="lp-ai-steps">
                {[
                  "Pegás un texto, tema o contenido",
                  "La IA lo resume y organiza automáticamente",
                  "Las tarjetas aparecen en el canvas al instante",
                ].map((s, i) => (
                  <div key={s} className="lp-ai-step-item">
                    <div className="lp-ai-step-num">{i + 1}</div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <div className="lp-ai-mockup">
                <div className="lp-ai-mockup-bar">
                  <div className="lp-ai-mockup-dot" style={{ background: "#ff5f57" }} />
                  <div className="lp-ai-mockup-dot" style={{ background: "#febc2e" }} />
                  <div className="lp-ai-mockup-dot" style={{ background: "#28c840" }} />
                  <div className="lp-ai-mockup-title">✨ Generando pizarrón…</div>
                </div>
                <div className="lp-ai-mockup-body">
                  <div
                    style={{
                      background: "rgba(255,255,255,.05)",
                      border: "1px solid rgba(255,255,255,.12)",
                      borderRadius: 8,
                      padding: "10px 12px",
                      marginBottom: 14,
                      fontSize: 12,
                      color: "rgba(255,255,255,.45)",
                      fontStyle: "italic",
                    }}
                  >
                    &ldquo;La fotosíntesis: proceso, etapas, cloroplastos…&rdquo;
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: 12,
                        background: "#c4b5fd",
                        marginLeft: 2,
                        animation: "aiPulse 1s ease infinite",
                        verticalAlign: "middle",
                      }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { color: "#dcfce7", label: "Proceso", delay: ".1s" },
                      { color: "#dbeafe", label: "Etapas", delay: ".3s" },
                      { color: "#fce7f3", label: "Cloroplasto", delay: ".5s" },
                    ].map((c) => (
                      <div
                        key={c.label}
                        style={{
                          background: c.color,
                          borderRadius: 8,
                          padding: "10px 8px",
                          animation: `aiCard .5s ${c.delay} ease both`,
                        }}
                      >
                        <div
                          style={{ fontSize: 10, fontWeight: 700, color: "#333", marginBottom: 6 }}
                        >
                          {c.label}
                        </div>
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            style={{
                              height: 5,
                              background: "rgba(0,0,0,.12)",
                              borderRadius: 3,
                              marginBottom: 4,
                              width: n === 2 ? "70%" : "90%",
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI MINDMAP */}
            <div className="lp-ai-card">
              <div
                className="lp-ai-card-badge"
                style={{ background: "linear-gradient(94deg,#059669,#10b981)" }}
              >
                ✨ IA Mapa Mental
              </div>
              <h3>Un tema → Mapa mental completo</h3>
              <p>
                Escribí un tema y la IA genera una estructura clara con nodos, ramas y conexiones.
                Vos decidís cómo enseñarlo — la IA organiza, vos enseñás.
              </p>
              <div className="lp-ai-steps">
                {[
                  "Escribís el tema o pegás tu texto",
                  "La IA genera la estructura de nodos",
                  "Editás, personalizás y enseñás",
                ].map((s, i) => (
                  <div key={s} className="lp-ai-step-item">
                    <div
                      className="lp-ai-step-num"
                      style={{ background: "linear-gradient(135deg,#6ee7b7,#10b981)" }}
                    >
                      {i + 1}
                    </div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <div className="lp-ai-mockup">
                <div className="lp-ai-mockup-bar">
                  <div className="lp-ai-mockup-dot" style={{ background: "#ff5f57" }} />
                  <div className="lp-ai-mockup-dot" style={{ background: "#febc2e" }} />
                  <div className="lp-ai-mockup-dot" style={{ background: "#28c840" }} />
                  <div className="lp-ai-mockup-title">✨ Generando mapa mental…</div>
                </div>
                <div
                  className="lp-ai-mockup-body"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "20px 16px",
                  }}
                >
                  <svg width="100%" viewBox="0 0 280 160" style={{ overflow: "visible" }}>
                    {[
                      { x1: 140, y1: 80, x2: 40, y2: 30 },
                      { x1: 140, y1: 80, x2: 40, y2: 80 },
                      { x1: 140, y1: 80, x2: 40, y2: 130 },
                      { x1: 140, y1: 80, x2: 240, y2: 30 },
                      { x1: 140, y1: 80, x2: 240, y2: 80 },
                      { x1: 140, y1: 80, x2: 240, y2: 130 },
                    ].map((l, i) => (
                      <line
                        key={i}
                        x1={l.x1}
                        y1={l.y1}
                        x2={l.x2}
                        y2={l.y2}
                        stroke="rgba(196,181,253,.4)"
                        strokeWidth="1.5"
                        strokeDasharray="80"
                        style={{
                          animation: `aiLine .4s ${i * 0.08}s ease forwards`,
                          strokeDashoffset: 80,
                        }}
                      />
                    ))}
                    <rect
                      x="105"
                      y="65"
                      width="70"
                      height="30"
                      rx="8"
                      fill="#7c4bff"
                      style={{ animation: "aiNode .3s ease both" }}
                    />
                    <text
                      x="140"
                      y="84"
                      textAnchor="middle"
                      fill="white"
                      fontSize="9"
                      fontWeight="700"
                    >
                      FOTOSÍNTESIS
                    </text>
                    {[
                      { x: 8, y: 18, label: "Luz solar", color: "#dbeafe", tc: "#1e40af", delay: ".2s" },
                      { x: 8, y: 68, label: "CO₂", color: "#dcfce7", tc: "#166534", delay: ".3s" },
                      { x: 8, y: 118, label: "Agua H₂O", color: "#fce7f3", tc: "#9d174d", delay: ".4s" },
                      { x: 202, y: 18, label: "Glucosa", color: "#fef9c3", tc: "#92400e", delay: ".25s" },
                      { x: 202, y: 68, label: "Clorofila", color: "#ede9fe", tc: "#5b21b6", delay: ".35s" },
                      { x: 202, y: 118, label: "O₂", color: "#ffedd5", tc: "#c2410c", delay: ".45s" },
                    ].map((n) => (
                      <g key={n.label} style={{ animation: `aiNode .35s ${n.delay} ease both` }}>
                        <rect x={n.x} y={n.y} width="70" height="24" rx="6" fill={n.color} />
                        <text
                          x={n.x + 35}
                          y={n.y + 15}
                          textAnchor="middle"
                          fill={n.tc}
                          fontSize="8"
                          fontWeight="600"
                        >
                          {n.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 52 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(196,181,253,.1)",
                border: "1px solid rgba(196,181,253,.2)",
                borderRadius: 12,
                padding: "12px 24px",
                marginBottom: 28,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {[
                "✨ IA incluida en plan Pro",
                "📄 Texto, tema o PDF",
                "🤖 La IA organiza, vos enseñás",
              ].map((f) => (
                <span key={f} style={{ fontSize: 13, color: "rgba(255,255,255,.65)", fontWeight: 600 }}>
                  {f}
                </span>
              ))}
            </div>
            <br />
            <button
              className="lp-btn lp-btn-primary lp-btn-lg"
              onClick={goSignup}
              style={{
                fontSize: 16,
                boxShadow: "0 8px 40px rgba(124,75,255,.5)",
                animation: "sparkle 3s ease infinite",
              }}
            >
              ✨ Probar la IA gratis 7 días →
            </button>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.3)", marginTop: 12 }}>
              Sin tarjeta de crédito · Después el acceso se limita
            </p>
          </div>
        </div>
      </div>

      {/* ── BEFORE / AFTER VISUAL ── */}
      <div style={{ background: "#06060f", padding: "72px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div
            className="lp-section-tag"
            style={{
              background: "rgba(255,255,255,.08)",
              color: "rgba(255,255,255,.65)",
              borderColor: "rgba(255,255,255,.12)",
            }}
          >
            🔄 La transformación
          </div>
          <h2
            style={{
              fontSize: "clamp(26px,3.2vw,40px)",
              fontWeight: 800,
              letterSpacing: "-.5px",
              margin: "18px 0 40px",
              color: "#fff",
              lineHeight: 1.15,
            }}
          >
            Así se ve preparar una clase
            <br />
            <span style={{ color: "#c4b5fd" }}>antes y después de EduDraw</span>
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 20,
              alignItems: "center",
            }}
          >
            <div
              style={{
                background: "rgba(239,68,68,.1)",
                border: "1.5px solid rgba(239,68,68,.3)",
                borderRadius: 20,
                padding: "28px 24px",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#f87171",
                  marginBottom: 16,
                }}
              >
                ❌ Antes
              </div>
              {[
                "Ideas sueltas, herramientas separadas",
                "3 o 5 apps abiertas para preparar una clase",
                "Tiempo perdido organizando, no enseñando",
                "Clase improvisada, sin estructura clara",
              ].map((t) => (
                <div
                  key={t}
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,.55)",
                    marginBottom: 10,
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ color: "#f87171", flexShrink: 0 }}>—</span>
                  {t}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 32, color: "#c4b5fd", fontWeight: 800 }}>→</div>
            <div
              style={{
                background: "rgba(16,185,129,.1)",
                border: "1.5px solid rgba(16,185,129,.3)",
                borderRadius: 20,
                padding: "28px 24px",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#6ee7b7",
                  marginBottom: 16,
                }}
              >
                ✅ Después
              </div>
              {[
                "Clase clara, visual y lista en minutos",
                "Un solo lugar para todo, con IA incluida",
                "Estructura automática desde tu texto",
                "Entrás al aula con confianza y orden",
              ].map((t) => (
                <div
                  key={t}
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,.75)",
                    marginBottom: 10,
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ color: "#6ee7b7", flexShrink: 0 }}>✓</span>
                  {t}
                </div>
              ))}
            </div>
          </div>
          <button
            className="lp-btn lp-btn-white lp-btn-lg"
            onClick={goSignup}
            style={{ marginTop: 40, fontSize: 16 }}
          >
            Crear mi primera clase ahora (gratis) →
          </button>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.3)", marginTop: 12 }}>
            7 días con acceso completo · Después el acceso se limita · Sin tarjeta
          </p>
        </div>
      </div>

      {/* ── DIFFERENTIAL ── */}
      <div className="lp-diff">
        <div className="lp-section-tag">🧠 Diferencial</div>
        <h2
          style={{
            fontSize: "clamp(26px,3.2vw,44px)",
            fontWeight: 800,
            letterSpacing: "-.5px",
            margin: "18px 0 12px",
            color: "#0a0a18",
          }}
        >
          Menos herramientas.
          <br />
          Más claridad. <span className="lp-mark">Mejores clases.</span>
        </h2>
        <p className="lp-section-sub">
          A diferencia de otras plataformas, EduDraw está pensado para enseñar — no solo para
          diseñar.
        </p>
        <div className="lp-diff-grid">
          {[
            {
              icon: "🚫",
              title: "Sin combinar 3 o 5 apps",
              desc: "No necesitás Canva para el diseño, Notion para las notas y Miro para los mapas. Acá tenés todo junto.",
            },
            {
              icon: "✨",
              title: "La IA te ayuda a estructurar tus ideas",
              desc: "No tenés que organizar todo manualmente. Pegás el contenido y la IA genera la estructura por vos automáticamente.",
            },
            {
              icon: "🎓",
              title: "Todo pensado para enseñar",
              desc: "Cada función fue diseñada para el flujo de trabajo de un profesor: organizar → visualizar → enseñar.",
            },
          ].map((d) => (
            <div key={d.title} className="lp-diff-card">
              <div className="lp-diff-icon">{d.icon}</div>
              <h3>{d.title}</h3>
              <p>{d.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOR WHOM ── */}
      <div
        style={{
          background: "#fafafe",
          borderTop: "1.5px solid #f0f0f8",
          borderBottom: "1.5px solid #f0f0f8",
        }}
      >
        <div className="lp-forwhom">
          <div className="lp-section-header">
            <div className="lp-section-tag">👩‍🏫 ¿Para quién es?</div>
            <h2
              style={{
                fontSize: "clamp(26px,3.2vw,44px)",
                fontWeight: 800,
                letterSpacing: "-.5px",
                color: "#0a0a18",
              }}
            >
              Para profesores y creadores de cursos
              <br />
              que quieren{" "}
              <span className="lp-mark">enseñar mejor sin perder tiempo</span>
            </h2>
          </div>
          <div className="lp-forwhom-grid">
            {[
              {
                icon: "👩‍🏫",
                title: "Profesores online",
                desc: "Crea clases visuales que enganchen a tus alumnos y se vean profesionales desde el primer día.",
              },
              {
                icon: "🎓",
                title: "Creadores de cursos",
                desc: "Estructura tus módulos con mapas mentales y diseña el contenido visual en la misma herramienta.",
              },
              {
                icon: "🧑‍💼",
                title: "Coaches y formadores",
                desc: "Organiza tus sesiones, frameworks y metodologías de forma visual y clara para tus clientes.",
              },
              {
                icon: "📚",
                title: "Cualquier persona que enseña",
                desc: "Si tienes algo que enseñar y quieres hacerlo de forma más clara y organizada, esta herramienta es para ti.",
              },
            ].map((f) => (
              <div key={f.title} className="lp-forwhom-card">
                <div className="lp-forwhom-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <section className="lp-section" id="testimonios">
        <div className="lp-section-header">
          <div className="lp-section-tag">💬 Testimonios</div>
          <h2>
            Lo que dicen quienes
            <br />
            <span className="lp-mark">ya enseñan con EduDraw</span>
          </h2>
          <p className="lp-section-sub">
            Más de 500 profesores y creadores de cursos en Latinoamérica.
          </p>
        </div>
        <div className="lp-testi-grid">
          {[
            {
              photo: "https://i.pravatar.cc/80?img=47",
              name: "María González",
              role: "Profesora online, Buenos Aires",
              text: "Ahora preparo mis clases en la mitad del tiempo. La IA me ayuda a organizar todo mucho más rápido y todo se ve mucho más claro.",
            },
            {
              photo: "https://i.pravatar.cc/80?img=33",
              name: "Carlos Ruiz",
              role: "Creador de cursos, Asunción",
              text: "Antes usaba varias herramientas, ahora hago todo en un solo lugar. Pegás el texto y la IA te da la estructura lista para enseñar.",
            },
            {
              photo: "https://i.pravatar.cc/80?img=16",
              name: "Laura Martínez",
              role: "Coach educativa, Montevideo",
              text: "Me ayudó a organizar mis ideas y enseñar mejor sin complicarme. Mis clientes dicen que mis sesiones son mucho más claras ahora.",
            },
            {
              photo: "https://i.pravatar.cc/80?img=12",
              name: "Andrés Pérez",
              role: "Formador corporativo, Lima",
              text: "Lo que más me sorprendió fue lo simple que es. En 5 minutos ya estaba creando mi primera clase con la IA generando la estructura.",
            },
            {
              photo: "https://i.pravatar.cc/80?img=25",
              name: "Sofía Torres",
              role: "Profesora universitaria, Bogotá",
              text: "Uso la IA para estructurar el módulo y la pizarra para explicarlo en clase. Antes tardaba horas — ahora en minutos tengo la base lista.",
            },
            {
              photo: "https://i.pravatar.cc/80?img=52",
              name: "Javier Moreno",
              role: "Instructor de marketing, Santiago",
              text: "Mis alumnos dicen que mis clases son más fáciles de entender desde que empecé a usar EduDraw. La diferencia es notable.",
            },
          ].map((t) => (
            <div key={t.name} className="lp-testi">
              <div className="lp-testi-stars">★★★★★</div>
              <p>&ldquo;{t.text}&rdquo;</p>
              <div className="lp-testi-author">
                <div className="lp-testi-avatar">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.photo} alt={t.name} />
                </div>
                <div>
                  <div className="lp-testi-name">{t.name}</div>
                  <div className="lp-testi-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <div className="lp-pricing-wrap" id="precios">
        <div className="lp-pricing-inner">
          <div className="lp-section-header" style={{ marginBottom: 52 }}>
            <div className="lp-section-tag">Precios</div>
            <h2
              style={{
                fontSize: "clamp(26px,3.2vw,44px)",
                fontWeight: 800,
                letterSpacing: "-.5px",
                color: "#0a0a18",
              }}
            >
              Menos de lo que cuesta
              <br />
              <span className="lp-mark">un café al mes</span>
            </h2>
            <p className="lp-section-sub" style={{ marginBottom: 20 }}>
              Accedé a una herramienta que reemplaza varias plataformas y te ahorra horas cada
              semana.
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "#fef9c3",
                border: "1.5px solid #fde68a",
                borderRadius: 12,
                padding: "10px 20px",
                fontSize: 14,
                color: "#92400e",
                fontWeight: 600,
              }}
            >
              ⏳ Tenés 7 días con acceso completo. Después, el acceso se limita. Suficiente para
              probar. Difícil volver atrás.
            </div>
          </div>
          <div className="lp-pricing-grid">
            <div className="lp-pcard">
              <h3>Free</h3>
              <div className="lp-pprice">
                $0 <span>/ mes</span>
              </div>
              <p className="lp-pdesc">Para empezar sin compromiso</p>
              <p className="lp-ptrial">
                🎁 7 días con acceso completo · IA incluida · Sin tarjeta · Después el acceso se
                limita
              </p>
              <ul className="lp-pfeats">
                <li>2 documentos (pizarras o mapas)</li>
                <li>Guardado automático en la nube</li>
                <li>Exportar PNG y SVG</li>
                <li>Todas las plantillas de mapas mentales</li>
                <li>Compartir por link de solo lectura</li>
              </ul>
              <button
                className="lp-btn lp-btn-outline"
                style={{ width: "100%", padding: 14 }}
                onClick={goSignup}
              >
                Empezar gratis →
              </button>
            </div>
            <div className="lp-pcard featured">
              <div className="lp-pbadge">✨ Más popular</div>
              <h3>Pro</h3>
              <div className="lp-pprice">
                $6 <span>/ mes</span>
              </div>
              <p className="lp-pdesc">Para docentes que quieren crear sin límites ni estrés</p>
              <p
                className="lp-ptrial"
                style={{
                  background: "rgba(97,40,255,.08)",
                  borderColor: "rgba(97,40,255,.2)",
                  color: "#5b21b6",
                }}
              >
                🚀 Acceso completo y permanente · Sin límites · Sin preocupaciones
              </p>
              <ul className="lp-pfeats">
                <li>✨ IA para resumir y organizar contenido</li>
                <li>Documentos ilimitados</li>
                <li>Pizarras y mapas mentales sin límite</li>
                <li>Carpetas para organizar todo</li>
                <li>Compartir por link + exportar PNG/SVG</li>
                <li>Soporte prioritario</li>
              </ul>
              <button
                className="lp-btn lp-btn-primary"
                style={{ width: "100%", padding: 14 }}
                onClick={() => {
                  pixelAddToCart();
                  window.open("https://pay.hotmart.com/E105478979P", "_blank");
                }}
              >
                Quiero el plan Pro →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ background: "#fff", borderTop: "1.5px solid #f0f0f8" }}>
        <div className="lp-faq">
          <div className="lp-section-header">
            <div className="lp-section-tag">❓ Preguntas frecuentes</div>
            <h2
              style={{
                fontSize: "clamp(26px,3.2vw,44px)",
                fontWeight: 800,
                letterSpacing: "-.5px",
                color: "#0a0a18",
              }}
            >
              Todo lo que querías saber
              <br />
              <span className="lp-mark">antes de empezar</span>
            </h2>
          </div>
          {[
            {
              q: "¿Necesito saber diseño para usarlo?",
              a: "No. EduDraw fue diseñado para profesores, no para diseñadores. Si sabes usar un celular, sabes usar EduDraw. Sin conocimientos de diseño ni tecnología.",
            },
            {
              q: "¿La IA hace todo por mí?",
              a: "No. La IA te ayuda a organizar, resumir y estructurar el contenido automáticamente — pero vos decidís cómo enseñarlo. Es una herramienta que trabaja con vos, no en lugar tuyo.",
            },
            {
              q: "¿Puedo probar antes de pagar?",
              a: "Sí. Tenés 7 días con acceso completo al plan Pro, incluyendo la IA, sin tarjeta de crédito y sin compromiso. Después podés seguir en modo limitado o desbloquear todo para crear sin límites.",
            },
            {
              q: "¿Es complicado de usar?",
              a: "Para nada. Tab = nodo hijo, Enter = hermano, doble click = editar. La mayoría crea su primera clase en menos de 5 minutos. Sin tutoriales ni configuraciones previas.",
            },
          ].map((item) => (
            <div key={item.q} className="lp-faq-item">
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SIGNUP FORM (CTA final) ── */}
      <div className="lp-signup-section" id="registro">
        <div className="lp-signup-inner">
          <h2>
            Empieza gratis y crea
            <br />
            tu primera clase hoy
          </h2>
          <p>
            Accedé a todas las funciones durante 7 días y descubrí lo fácil que puede ser crear
            clases claras, visuales y bien organizadas.
          </p>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.8)", marginBottom: 8 }}>
            ✨ IA incluida para resumir y estructurar tus ideas automáticamente
          </p>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.75)", marginBottom: 32 }}>
            👉 No necesitás tarjeta de crédito
          </p>

          <div className="lp-signup-card">
            <form onSubmit={handleFormSubmit}>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />

              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mín. 8 caracteres"
                required
                minLength={8}
                autoComplete="new-password"
              />

              {formError && <div className="lp-signup-error">{formError}</div>}

              <button
                type="submit"
                disabled={formLoading || !formReady}
                className="lp-signup-submit"
              >
                {formLoading
                  ? "Creando tu cuenta…"
                  : !formReady
                    ? "Completá los datos para continuar"
                    : "🚀 Crear mi cuenta gratis"}
              </button>

              <p
                style={{
                  fontSize: 12,
                  color: "#999",
                  textAlign: "center",
                  marginTop: 14,
                  lineHeight: 1.6,
                }}
              >
                Después de probarlo, podés seguir usando la herramienta en modo limitado o
                desbloquear todo para seguir creando sin límites.
                <br />
                <strong style={{ color: "#6128ff" }}>
                  💥 Suficiente para probar. Difícil volver atrás.
                </strong>
              </p>
            </form>
          </div>

          <div className="lp-signup-trust">
            <span>✅ Sin tarjeta de crédito</span>
            <span>✅ Acceso completo por 7 días</span>
            <span>✅ Cancelá cuando quieras</span>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div>
            <div className="lp-footer-logo">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="#7c4bff" />
                <path
                  d="M6 20L11 13L15 17L22 9"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              EduDraw
            </div>
            <p className="lp-footer-desc">
              Pizarra libre y mapas mentales en un solo lugar. Para educadores que quieren enseñar
              de forma más visual.
            </p>
          </div>
          <div className="lp-footer-col">
            <h4>Producto</h4>
            <a href="#herramientas">Pizarra libre</a>
            <a href="#herramientas">Mapas mentales</a>
            <a href="#plantillas">Plantillas</a>
            <a href="#precios">Precios</a>
          </div>
          <div className="lp-footer-col">
            <h4>Cuenta</h4>
            <button onClick={goApp}>Iniciar sesión</button>
            <button onClick={goSignup}>Crear cuenta gratis</button>
            <button onClick={goSignup}>Probar Pro</button>
          </div>
          <div className="lp-footer-col">
            <h4>Legal</h4>
            <a href="#">Términos de uso</a>
            <a href="#">Privacidad</a>
          </div>
        </div>
        <div className="lp-footer-bottom">
          © 2026 EduDraw · Hecho con ❤️ para docentes de Latinoamérica
        </div>
      </footer>
    </div>
  );
}
