import React, { useEffect } from "react";

interface Props {
  onLogin: () => void;
  onGuest?: () => void;
}

const css = `
  @font-face {
    font-family: "Excalifont";
    src: url("/fonts/excalifont.woff2") format("woff2");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: "Assistant";
    src: url("/fonts/Assistant-Regular.woff2") format("woff2");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: "Assistant";
    src: url("/fonts/Assistant-SemiBold.woff2") format("woff2");
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: "Assistant";
    src: url("/fonts/Assistant-Bold.woff2") format("woff2");
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }

  html, body { overflow-x: hidden !important; max-width: 100vw; }

  .lp {
    font-family: "Assistant", "Segoe UI", system-ui, sans-serif;
    color: #1a1a2e;
    background: #fff;
    overflow-x: hidden;
    max-width: 100vw;
    -webkit-font-smoothing: antialiased;
  }
  .lp *, .lp *::before, .lp *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lp a { color: inherit; text-decoration: none; }
  .lp-excali { font-family: "Excalifont", cursive; font-weight: 400; }

  /* ── Highlighter effect ──────────────────────────────────── */
  .lp-mark {
    position: relative;
    display: inline;
    white-space: nowrap;
    z-index: 0;
  }
  .lp-mark::before {
    content: "";
    position: absolute;
    left: -6px; right: -6px;
    top: 4px; bottom: -2px;
    background: rgba(158, 138, 255, 0.22);
    border-radius: 6px;
    transform: rotate(-1.2deg);
    z-index: -1;
  }

  .lp-mark-yellow {
    position: relative;
    display: inline;
    white-space: nowrap;
    z-index: 0;
  }
  .lp-mark-yellow::before {
    content: "";
    position: absolute;
    left: -4px; right: -4px;
    top: 2px; bottom: -3px;
    background: rgba(255, 214, 0, 0.28);
    border-radius: 4px;
    transform: rotate(0.8deg);
    z-index: -1;
  }

  /* ── Buttons ──────────────────────────────────────────────── */
  .lp-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 10px 22px; border-radius: 8px; font-size: 15px; font-weight: 600;
    cursor: pointer; border: none; transition: all .15s; white-space: nowrap;
    font-family: "Assistant", inherit; letter-spacing: .1px;
  }
  .lp-btn-primary { background: #6128ff; color: #fff; }
  .lp-btn-primary:hover { background: #4f1fe0; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(97,40,255,.38); }
  .lp-btn-outline { background: transparent; color: #6128ff; border: 1.5px solid #6128ff; }
  .lp-btn-outline:hover { background: rgba(97,40,255,.06); }
  .lp-btn-ghost { background: transparent; color: #444; border: 1.5px solid #e0e0e0; }
  .lp-btn-ghost:hover { background: #f5f5f5; }
  .lp-btn-lg { padding: 14px 34px; font-size: 16px; border-radius: 10px; }
  .lp-btn-white { background: #fff; color: #6128ff; }
  .lp-btn-white:hover { background: #f0ecff; transform: translateY(-1px); }

  /* ── Nav ──────────────────────────────────────────────────── */
  .lp-nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 52px; height: 66px;
    background: rgba(255,255,255,.94); backdrop-filter: blur(18px);
    border-bottom: 1px solid rgba(0,0,0,.07);
  }
  .lp-nav-logo {
    display: flex; align-items: center; gap: 9px;
    font-size: 20px; font-weight: 700; color: #111;
    font-family: "Excalifont", cursive;
  }
  .lp-nav-logo-dot { color: #6128ff; }
  .lp-nav-links { display: flex; align-items: center; gap: 30px; }
  .lp-nav-links a { font-size: 15px; color: #555; font-weight: 500; transition: color .15s; }
  .lp-nav-links a:hover { color: #6128ff; }
  .lp-nav-btns { display: flex; gap: 10px; }

  /* ── Hero ──────────────────────────────────────────────────── */
  .lp-hero {
    text-align: center;
    padding: 96px 24px 64px;
    background: radial-gradient(ellipse 80% 55% at 50% -8%, rgba(97,40,255,.09) 0%, transparent 65%);
    position: relative; overflow: hidden;
  }
  .lp-hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(94deg,rgba(158,138,255,.15),rgba(127,96,255,.12));
    color: #6128ff; border: 1px solid rgba(97,40,255,.2);
    border-radius: 99px; padding: 6px 18px;
    font-size: 13px; font-weight: 600; margin-bottom: 32px;
    letter-spacing: .2px;
  }
  .lp-hero h1 {
    font-size: clamp(38px, 5.5vw, 68px);
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -.5px;
    max-width: 840px;
    margin: 0 auto 24px;
    color: #111;
    font-family: "Assistant", sans-serif;
  }
  .lp-hero h1 .excali-line {
    font-family: "Excalifont", cursive;
    font-weight: 400;
    font-size: 1.08em;
    display: block;
    color: #111;
    margin-top: 4px;
  }
  .lp-hero-sub {
    font-size: clamp(16px, 2vw, 19px); color: #666; max-width: 560px;
    margin: 0 auto 44px; line-height: 1.7; font-weight: 400;
  }
  .lp-hero-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px; }
  .lp-hero-note { font-size: 13px; color: #aaa; letter-spacing: .1px; }
  .lp-hero-img {
    margin: 60px auto 0; max-width: 980px; width: calc(100% - 48px);
    border-radius: 20px; border: 1px solid #e4e0f5;
    box-shadow: 0 2px 0 #e4e0f5, 0 24px 80px rgba(97,40,255,.16), 0 8px 24px rgba(0,0,0,.06);
    overflow: hidden;
  }
  .lp-hero-img img { width: 100%; display: block; }

  /* ── Logos ──────────────────────────────────────────────────── */
  .lp-logos {
    padding: 44px 52px 52px;
    background: #fafafa;
    border-top: 1px solid #f0f0f0;
    border-bottom: 1px solid #f0f0f0;
  }
  .lp-logos-title {
    text-align: center; font-size: 12px; color: #aaa; font-weight: 600;
    text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 28px;
    font-family: "Assistant", sans-serif;
  }
  .lp-logos-row {
    display: flex; align-items: center; justify-content: center;
    gap: 52px; flex-wrap: wrap;
  }
  .lp-logos-row img { height: 22px; opacity: .4; filter: grayscale(1); transition: opacity .2s, filter .2s; }
  .lp-logos-row img:hover { opacity: .75; filter: none; }

  /* ── Section ────────────────────────────────────────────────── */
  .lp-section { padding: 88px 52px; max-width: 1160px; margin: 0 auto; }
  .lp-section-header { text-align: center; margin-bottom: 56px; }
  .lp-section-tag {
    display: inline-block; background: #f0ecff; color: #6128ff;
    border-radius: 99px; padding: 4px 14px; font-size: 12px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .8px; margin-bottom: 16px;
    font-family: "Assistant", sans-serif;
  }
  .lp-section h2 {
    font-size: clamp(26px, 3.2vw, 42px); font-weight: 700;
    letter-spacing: -.3px; margin-bottom: 14px; color: #111;
    font-family: "Assistant", sans-serif;
  }
  .lp-section-sub { font-size: 17px; color: #666; max-width: 520px; margin: 0 auto; line-height: 1.65; }

  /* ── Features ───────────────────────────────────────────────── */
  .lp-grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 22px; }
  .lp-feat-card {
    background: #fff; border: 1px solid #eaebf0; border-radius: 18px;
    padding: 30px 26px; transition: box-shadow .25s, transform .25s, border-color .25s;
  }
  .lp-feat-card:hover {
    box-shadow: 0 12px 40px rgba(97,40,255,.11);
    transform: translateY(-3px);
    border-color: rgba(97,40,255,.2);
  }
  .lp-feat-icon {
    width: 50px; height: 50px; border-radius: 13px;
    background: linear-gradient(135deg, #f0ecff, #ddd8ff);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; margin-bottom: 18px;
  }
  .lp-feat-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 9px; color: #111; }
  .lp-feat-card p { font-size: 14px; color: #666; line-height: 1.65; }

  /* ── Feature split rows ─────────────────────────────────────── */
  .lp-split {
    display: grid; grid-template-columns: 1fr 1fr; gap: 80px;
    align-items: center; padding: 72px 52px;
    max-width: 1160px; margin: 0 auto; width: 100%;
  }
  .lp-split.reverse .lp-split-text { order: 2; }
  .lp-split.reverse .lp-split-visual { order: 1; }
  .lp-split-text h2 {
    font-size: clamp(24px, 2.8vw, 38px); font-weight: 700;
    letter-spacing: -.3px; margin-bottom: 14px; color: #111;
    line-height: 1.2; font-family: "Assistant", sans-serif;
  }
  .lp-split-text p { font-size: 16px; color: #666; line-height: 1.7; margin-bottom: 24px; }
  .lp-split-text ul { list-style: none; }
  .lp-split-text ul li {
    font-size: 15px; color: #555; padding: 7px 0;
    display: flex; align-items: center; gap: 10px;
  }
  .lp-split-text ul li::before {
    content: "";
    display: inline-block; width: 20px; height: 20px;
    border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, #9E8AFF, #6128ff);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='9' viewBox='0 0 11 9'%3E%3Cpath d='M1 4.5l3.5 3.5 5.5-7' stroke='white' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: center;
  }
  .lp-split-visual {
    background: linear-gradient(135deg, #f6f3ff, #ebe5ff);
    border-radius: 20px; padding: 40px;
    display: flex; align-items: center; justify-content: center;
    min-height: 300px; border: 1px solid #e4dcff;
    font-size: 72px; text-align: center;
  }

  /* ── Steps ──────────────────────────────────────────────────── */
  .lp-steps-bg {
    background: linear-gradient(160deg, #f8f6ff 0%, #fff 70%);
    padding: 88px 0;
  }
  .lp-steps-inner { max-width: 960px; margin: 0 auto; padding: 0 52px; }
  .lp-steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-top: 56px; }
  .lp-step { text-align: center; }
  .lp-step-n {
    width: 54px; height: 54px; border-radius: 50%;
    background: linear-gradient(135deg, #9E8AFF, #6128ff);
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 800; margin: 0 auto 20px;
    box-shadow: 0 8px 24px rgba(97,40,255,.32);
    font-family: "Excalifont", cursive;
  }
  .lp-step h3 { font-size: 17px; font-weight: 700; margin-bottom: 9px; color: #111; }
  .lp-step p { font-size: 14px; color: #666; line-height: 1.65; }

  /* ── Testimonials ───────────────────────────────────────────── */
  .lp-testi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 18px; }
  .lp-testi {
    background: #fff; border: 1px solid #eaebf0; border-radius: 18px;
    padding: 26px 22px; transition: box-shadow .2s;
  }
  .lp-testi:hover { box-shadow: 0 8px 32px rgba(0,0,0,.07); }
  .lp-testi-stars { color: #6128ff; font-size: 14px; margin-bottom: 14px; letter-spacing: 1px; }
  .lp-testi p { font-size: 15px; color: #333; line-height: 1.7; margin-bottom: 18px; }
  .lp-testi-author { display: flex; align-items: center; gap: 12px; }
  .lp-testi-author img { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; }
  .lp-testi-name { font-size: 14px; font-weight: 700; color: #111; }
  .lp-testi-handle { font-size: 13px; color: #aaa; }

  /* ── Pricing ────────────────────────────────────────────────── */
  .lp-pricing-wrap { background: #fafafa; padding: 88px 0; border-top: 1px solid #f0f0f0; }
  .lp-pricing-inner { max-width: 780px; margin: 0 auto; padding: 0 52px; }
  .lp-pricing-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-top: 0;
  }
  .lp-pcard {
    border: 1.5px solid #eaebf0; border-radius: 22px;
    padding: 36px 28px; background: #fff; position: relative;
    transition: box-shadow .2s;
  }
  .lp-pcard:hover { box-shadow: 0 12px 40px rgba(0,0,0,.07); }
  .lp-pcard.featured {
    border-color: #6128ff;
    box-shadow: 0 0 0 4px rgba(97,40,255,.08);
    background: linear-gradient(160deg, #fff 0%, #faf8ff 100%);
  }
  .lp-pbadge {
    position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
    background: linear-gradient(94deg, #9E8AFF, #6128ff); color: #fff;
    padding: 4px 18px; border-radius: 99px; font-size: 12px;
    font-weight: 700; white-space: nowrap; letter-spacing: .2px;
  }
  .lp-pcard h3 { font-size: 19px; font-weight: 700; margin-bottom: 4px; color: #111; }
  .lp-pprice {
    font-size: 50px; font-weight: 700; color: #111;
    letter-spacing: -1.5px; margin: 14px 0 4px;
    font-family: "Assistant", sans-serif;
  }
  .lp-pprice span { font-size: 15px; font-weight: 400; color: #888; }
  .lp-pdesc { font-size: 14px; color: #777; margin-bottom: 26px; line-height: 1.5; }
  .lp-ptrial { font-size: 12px; color: #6128ff; font-weight: 600; margin-bottom: 24px; letter-spacing: .1px; }
  .lp-pfeats { list-style: none; margin-bottom: 28px; }
  .lp-pfeats li {
    font-size: 14px; padding: 7px 0;
    border-bottom: 1px solid #f5f5f5;
    display: flex; align-items: center; gap: 9px; color: #444;
  }
  .lp-pfeats li::before {
    content: "";
    display: inline-block; width: 18px; height: 18px; border-radius: 50%;
    flex-shrink: 0;
    background: linear-gradient(135deg, #9E8AFF, #6128ff);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='8' viewBox='0 0 10 8'%3E%3Cpath d='M1 4l3 3 5-6' stroke='white' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: center;
  }

  /* ── CTA Banner ──────────────────────────────────────────────── */
  .lp-cta {
    background: linear-gradient(135deg, #4a0fcc 0%, #6128ff 55%, #7c4bff 100%);
    color: #fff; text-align: center; padding: 96px 48px;
    position: relative; overflow: hidden;
  }
  .lp-cta::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 65% 55% at 50% 115%, rgba(255,255,255,.1) 0%, transparent 65%);
  }
  .lp-cta-inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
  .lp-cta h2 {
    font-size: clamp(28px, 4vw, 50px); font-weight: 700;
    letter-spacing: -.5px; margin-bottom: 14px;
    font-family: "Excalifont", cursive; font-weight: 400;
  }
  .lp-cta p { font-size: 17px; opacity: .82; margin-bottom: 40px; line-height: 1.6; }
  .lp-cta-note { font-size: 13px; opacity: .55; margin-top: 14px; }

  /* ── Footer ──────────────────────────────────────────────────── */
  .lp-footer { background: #0d0d1a; color: #fff; padding: 64px 52px 28px; }
  .lp-footer-top {
    display: flex; flex-wrap: wrap; gap: 48px;
    justify-content: space-between; margin-bottom: 52px;
  }
  .lp-footer-logo {
    font-size: 22px; font-weight: 400; color: #b8a4ff;
    margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
    font-family: "Excalifont", cursive;
  }
  .lp-footer-desc { font-size: 14px; color: rgba(255,255,255,.35); max-width: 220px; line-height: 1.65; }
  .lp-footer-col h4 {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 1px; color: rgba(255,255,255,.3); margin-bottom: 16px;
  }
  .lp-footer-col a, .lp-footer-col button {
    display: block; font-size: 14px; color: rgba(255,255,255,.55);
    margin-bottom: 10px; background: none; border: none;
    cursor: pointer; font-family: inherit; text-align: left;
    padding: 0; transition: color .15s;
  }
  .lp-footer-col a:hover, .lp-footer-col button:hover { color: #fff; }
  .lp-footer-bottom {
    border-top: 1px solid rgba(255,255,255,.07);
    padding-top: 24px; font-size: 13px;
    color: rgba(255,255,255,.25); text-align: center;
  }

  /* ── Stat row ────────────────────────────────────────────────── */
  .lp-stats { display: flex; justify-content: center; gap: 64px; flex-wrap: wrap; padding: 56px 52px; }
  .lp-stat { text-align: center; }
  .lp-stat-n {
    font-size: 42px; font-weight: 700; color: #6128ff; letter-spacing: -1px;
    font-family: "Excalifont", cursive; font-weight: 400;
  }
  .lp-stat-label { font-size: 14px; color: #888; margin-top: 4px; }

  /* ── Responsive ──────────────────────────────────────────────── */
  @media (max-width: 900px) {
    .lp-split { grid-template-columns: 1fr; gap: 40px; padding: 56px 24px; }
    .lp-split.reverse { direction: ltr; }
    .lp-steps-grid { grid-template-columns: 1fr; gap: 32px; }
    .lp-pricing-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 768px) {
    .lp-nav { padding: 0 20px; height: 60px; }
    .lp-nav-links { display: none; }
    .lp-hero { padding: 64px 20px 48px; }
    .lp-section { padding: 56px 20px; }
    .lp-steps-bg { padding: 56px 0; }
    .lp-steps-inner { padding: 0 20px; }
    .lp-logos { padding: 36px 20px; }
    .lp-logos-row { gap: 28px; }
    .lp-cta { padding: 64px 24px; }
    .lp-footer { padding: 48px 20px 24px; }
    .lp-stats { gap: 36px; padding: 40px 20px; }
    .lp-pricing-inner { padding: 0 20px; }
    .lp-hero-img { width: calc(100% - 32px); }
  }
`;

export const LandingPage: React.FC<Props> = ({ onLogin, onGuest }) => {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");

    const prev = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      rootHeight: root?.style.height ?? "",
      rootOverflow: root?.style.overflow ?? "",
    };

    html.style.overflow = "auto";
    html.style.height = "auto";
    body.style.overflow = "auto";
    body.style.height = "auto";
    if (root) {
      root.style.height = "auto";
      root.style.overflow = "visible";
    }

    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.height = prev.htmlHeight;
      body.style.overflow = prev.bodyOverflow;
      body.style.height = prev.bodyHeight;
      if (root) {
        root.style.height = prev.rootHeight;
        root.style.overflow = prev.rootOverflow;
      }
    };
  }, []);

  return (
    <div className="lp">
      <style>{css}</style>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="#6128ff"/>
            <path d="M6 20L11 13L15 17L22 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          EduDraw
        </div>
        <div className="lp-nav-links">
          <a href="#features">Funciones</a>
          <a href="#como-funciona">¿Cómo funciona?</a>
          <a href="#testimonios">Testimonios</a>
          <a href="#precios">Precios</a>
        </div>
        <div className="lp-nav-btns">
          <button className="lp-btn lp-btn-ghost" style={{fontSize:14, padding:"8px 18px"}} onClick={onLogin}>Iniciar sesión</button>
          <button className="lp-btn lp-btn-primary" style={{fontSize:14, padding:"8px 18px"}} onClick={onLogin}>Empezar gratis →</button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-badge">✏️ Pizarra digital para educadores</div>
        <h1>
          Llevá tus clases al siguiente nivel
          <span className="excali-line">
            con tu&nbsp;<span className="lp-mark">pizarra digital</span>
          </span>
        </h1>
        <p className="lp-hero-sub">
          Guardá tus dibujos en la nube. Colaborá sin fricción.
          Accedé desde cualquier dispositivo. <span className="lp-mark-yellow">Enseñá de forma más visual e impactante.</span>
        </p>
        <div className="lp-hero-btns">
          <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={onLogin}>
            🚀 Empezar gratis
          </button>
          <button className="lp-btn lp-btn-ghost lp-btn-lg" onClick={onGuest ?? onLogin}>
            Ver demo →
          </button>
        </div>
        <p className="lp-hero-note">Sin tarjeta de crédito · Plan gratuito para siempre · 14 días de prueba Pro</p>
        <div className="lp-hero-img">
          <img src="/hero-screenshot.png" alt="EduDraw editor" />
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <div style={{ borderBottom:"1px solid #f0f0f0" }}>
        <div className="lp-stats">
          {[
            { n: "50k+", label: "Educadores activos" },
            { n: "1.2M+", label: "Dibujos creados" },
            { n: "180+", label: "Países del mundo" },
            { n: "4.9★", label: "Calificación promedio" },
          ].map((s) => (
            <div key={s.label} className="lp-stat">
              <div className="lp-stat-n">{s.n}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LOGOS ───────────────────────────────────────────── */}
      <div className="lp-logos">
        <p className="lp-logos-title">Educadores de equipos en todo el mundo</p>
        <div className="lp-logos-row">
          <img src="/logo-microsoft.svg" alt="Microsoft" />
          <img src="/logo-meta.svg" alt="Meta" />
          <img src="/logo-stripe.svg" alt="Stripe" />
          <img src="/logo-netlify.svg" alt="Netlify" />
          <img src="/logo-supabase.svg" alt="Supabase" />
        </div>
      </div>

      {/* ── FEATURES GRID ───────────────────────────────────── */}
      <section className="lp-section" id="features">
        <div className="lp-section-header">
          <div className="lp-section-tag">Funciones</div>
          <h2>
            Todo lo que necesitás para{" "}
            <span className="lp-mark">enseñar mejor</span>
          </h2>
          <p className="lp-section-sub">
            Herramientas pensadas para el aula moderna, no para la oficina.
          </p>
        </div>
        <div className="lp-grid-3">
          {[
            {
              icon: "☁️",
              title: "Guardado automático en la nube",
              desc: "Todos tus dibujos se sincronizan en tiempo real. Accedé desde cualquier dispositivo sin perder nada.",
            },
            {
              icon: "🤝",
              title: "Colaboración en tiempo real",
              desc: "Invitá a colegas o alumnos por link. Trabajen juntos en el mismo canvas con voz y pantalla compartida.",
            },
            {
              icon: "🎤",
              title: "Modo presentación",
              desc: "Presentá tu pizarra como slides online. Exportá a PDF o PPTX para llevar tus clases a cualquier lado.",
            },
            {
              icon: "🤖",
              title: "IA generativa",
              desc: "Convertí texto en diagrama o wireframe a código. Explicá conceptos complejos en segundos con asistencia IA.",
            },
            {
              icon: "📁",
              title: "Dashboard con carpetas",
              desc: "Organizá tus dibujos por materia, clase o proyecto. Compartí colecciones con tu equipo.",
            },
            {
              icon: "✏️",
              title: "Dibujo a mano alzada",
              desc: "Trazos con aspecto hecho a mano que hacen tus explicaciones más claras y memorables.",
            },
          ].map((f) => (
            <div key={f.title} className="lp-feat-card">
              <div className="lp-feat-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SPLIT: Collaboration ─────────────────────────────── */}
      <div style={{ background:"#fafafa", borderTop:"1px solid #f0f0f0", borderBottom:"1px solid #f0f0f0" }}>
        <div className="lp-split">
          <div className="lp-split-text">
            <div className="lp-section-tag" style={{marginBottom:14}}>Colaboración</div>
            <h2>
              Enseñá con tu equipo,{" "}
              <span className="lp-mark">sin fricción</span>
            </h2>
            <p>
              Invitá a colegas, tutores o alumnos a tu canvas. Trabajen juntos
              en tiempo real desde cualquier lugar del mundo.
            </p>
            <ul>
              <li>Acceso por link, sin registro requerido</li>
              <li>Modo solo-lectura para audiencias</li>
              <li>Chat de voz y pantalla compartida</li>
              <li>Comentarios y feedback estructurado</li>
            </ul>
          </div>
          <div className="lp-split-visual">🤝</div>
        </div>
      </div>

      {/* ── SPLIT: Presentations ─────────────────────────────── */}
      <div>
        <div className="lp-split reverse">
          <div className="lp-split-text">
            <div className="lp-section-tag" style={{marginBottom:14}}>Presentaciones</div>
            <h2>
              De la pizarra a los{" "}
              <span className="lp-mark">slides en un click</span>
            </h2>
            <p>
              Presentá tu trabajo online como slides, hacé presentaciones en
              tiempo real con tus alumnos, o exportá a PDF y PPTX.
            </p>
            <ul>
              <li>Exportar a PDF o PPTX</li>
              <li>Presentaciones online en tiempo real</li>
              <li>Compartir o embeber slides</li>
              <li>Modo pantalla completa sin distracciones</li>
            </ul>
          </div>
          <div className="lp-split-visual">🎤</div>
        </div>
      </div>

      {/* ── STEPS ───────────────────────────────────────────── */}
      <div className="lp-steps-bg" id="como-funciona">
        <div className="lp-steps-inner">
          <div style={{ textAlign: "center" }}>
            <div className="lp-section-tag">¿Cómo funciona?</div>
            <h2
              style={{
                fontSize: "clamp(26px,3.2vw,42px)",
                fontWeight: 700,
                letterSpacing: "-.3px",
                marginBottom: 12,
                color: "#111",
                fontFamily: '"Assistant", sans-serif',
              }}
            >
              Tres pasos y ya estás{" "}
              <span className="lp-excali lp-mark">dibujando</span>
            </h2>
            <p style={{ fontSize: 17, color: "#666" }}>
              Sin instalación. Corre en el navegador.
            </p>
          </div>
          <div className="lp-steps-grid">
            {[
              {
                n: "1",
                title: "Creá tu cuenta",
                desc: "Registro gratuito en segundos. Solo tu email, sin complicaciones.",
              },
              {
                n: "2",
                title: "Abrí o creá un dibujo",
                desc: "Empezá desde cero, elegí una plantilla o importá un archivo existente.",
              },
              {
                n: "3",
                title: "Enseñá y presentá",
                desc: "Usá el modo presentación o exportá como imagen, PDF o PPTX.",
              },
            ].map((s) => (
              <div key={s.n} className="lp-step">
                <div className="lp-step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section className="lp-section" id="testimonios">
        <div className="lp-section-header">
          <div className="lp-section-tag">Testimonios</div>
          <h2>
            Lo que dicen{" "}
            <span className="lp-mark">miles de educadores</span>
          </h2>
        </div>
        <div className="lp-testi-grid">
          {[
            {
              name: "Theo",
              handle: "@t3dotgg",
              avatar: "/avatar-theo.jpg",
              text: "De todas mis herramientas favoritas, esta es la que más uso en mis clases. Increíblemente fluida y visual.",
            },
            {
              name: "Guillermo Rauch",
              handle: "@rauchg",
              avatar: "/avatar-guillermo.jpg",
              text: "Producto de altísima calidad respaldado por un equipo distribuido y apasionado. La mejor herramienta para explicar arquitecturas.",
            },
            {
              name: "Gergely Orosz",
              handle: "@GergelyOrosz",
              avatar: "/avatar-gergely.jpg",
              text: "Cliente de pago desde que abrieron el plan Pro y siguen iterando rápido. Mis alumnos entienden mucho mejor los conceptos.",
            },
            {
              name: "Andrej Karpathy",
              handle: "@karpathy",
              avatar: "/avatar-theo.jpg",
              text: "Realmente increíble y útil para gráficos y diagramas. Lo uso todo el tiempo para explicar conceptos de IA.",
            },
            {
              name: "Adam Wathan",
              handle: "@adamwathan",
              avatar: "/avatar-guillermo.jpg",
              text: "Excalidraw es una de mis herramientas favoritas de todos los tiempos. Nada se le acerca para explicar ideas rápido.",
            },
            {
              name: "François Fleuret",
              handle: "@francoisfleuret",
              avatar: "/avatar-gergely.jpg",
              text: "Una de las GUI más fluidas e intuitivas que haya encontrado, si no la mejor. Perfecta para clases técnicas.",
            },
          ].map((t) => (
            <div key={t.handle} className="lp-testi">
              <div className="lp-testi-stars">★★★★★</div>
              <p>"{t.text}"</p>
              <div className="lp-testi-author">
                <img src={t.avatar} alt={t.name} />
                <div>
                  <div className="lp-testi-name">{t.name}</div>
                  <div className="lp-testi-handle">{t.handle}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <div className="lp-pricing-wrap" id="precios">
        <div className="lp-pricing-inner">
          <div className="lp-section-header" style={{ marginBottom: 48 }}>
            <div className="lp-section-tag">Precios</div>
            <h2>
              Precios simples,{" "}
              <span className="lp-mark">sin sorpresas</span>
            </h2>
            <p className="lp-section-sub">
              Empezá gratis. Escalá al Pro cuando lo necesites.
            </p>
          </div>
          <div className="lp-pricing-grid">
            <div className="lp-pcard">
              <h3>Free</h3>
              <div className="lp-pprice">
                $0 <span>/ mes</span>
              </div>
              <p className="lp-pdesc">Para docentes que quieren explorar</p>
              <ul className="lp-pfeats">
                <li>Dibujos ilimitados</li>
                <li>Guardado automático en la nube</li>
                <li>Exportar PNG / SVG / JSON</li>
                <li>Modo presentación básico</li>
                <li>IA generativa (10 req/día)</li>
              </ul>
              <button
                className="lp-btn lp-btn-outline"
                style={{ width: "100%", padding: 13 }}
                onClick={onLogin}
              >
                Empezar gratis
              </button>
            </div>
            <div className="lp-pcard featured">
              <div className="lp-pbadge">✨ Más popular</div>
              <h3>Plus</h3>
              <div className="lp-pprice">
                $6 <span>/ mes por usuario</span>
              </div>
              <p className="lp-pdesc">Para equipos y docentes avanzados</p>
              <p className="lp-ptrial">🎁 14 días de prueba gratuita</p>
              <ul className="lp-pfeats">
                <li>Todo lo de Free</li>
                <li>IA generativa extendida (100 req/día)</li>
                <li>Exportar PDF y PPTX</li>
                <li>Colaboración con voz y pantalla</li>
                <li>Workspace en equipo</li>
                <li>Soporte prioritario</li>
              </ul>
              <button
                className="lp-btn lp-btn-primary"
                style={{ width: "100%", padding: 13 }}
                onClick={onLogin}
              >
                Probar 14 días gratis →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <div className="lp-cta">
        <div className="lp-cta-inner">
          <h2>¿Listo para transformar tus clases?</h2>
          <p>
            Únete a más de 50.000 educadores que ya enseñan de forma
            más visual, colaborativa e impactante.
          </p>
          <button
            className="lp-btn lp-btn-white lp-btn-lg"
            onClick={onLogin}
            style={{ fontSize: 17, padding: "15px 42px" }}
          >
            Empezar gratis ahora →
          </button>
          <p className="lp-cta-note">Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────── */}
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
              La pizarra digital para educadores modernos. Código abierto,
              privacidad garantizada.
            </p>
          </div>
          <div className="lp-footer-col">
            <h4>Producto</h4>
            <a href="#features">Funciones</a>
            <a href="#como-funciona">¿Cómo funciona?</a>
            <a href="#precios">Precios</a>
            <a href="#testimonios">Testimonios</a>
          </div>
          <div className="lp-footer-col">
            <h4>Cuenta</h4>
            <button onClick={onLogin}>Iniciar sesión</button>
            <button onClick={onLogin}>Crear cuenta gratis</button>
            <button onClick={onLogin}>Probar Plus</button>
          </div>
          <div className="lp-footer-col">
            <h4>Legal</h4>
            <a href="#">Privacidad</a>
            <a href="#">Términos de uso</a>
            <a href="#">Seguridad</a>
          </div>
        </div>
        <div className="lp-footer-bottom">
          © 2026 EduDraw · Hecho con ✏️ para educadores de todo el mundo
        </div>
      </footer>
    </div>
  );
};
