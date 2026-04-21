import React, { useEffect, useState } from "react";
import { signUpWithEmail } from "../data/supabase";
import { pixelLead, pixelRegistration, pixelInitCheckout } from "../data/metaPixel";

interface Props {
  onLogin: () => void;
  onSignup?: () => void;
  onGuest?: () => void;
}

const css = `
  @font-face { font-family:"Excalifont"; src:url("/fonts/excalifont.woff2") format("woff2"); font-display:swap; }
  @font-face { font-family:"Assistant"; src:url("/fonts/Assistant-Regular.woff2") format("woff2"); font-weight:400; font-display:swap; }
  @font-face { font-family:"Assistant"; src:url("/fonts/Assistant-SemiBold.woff2") format("woff2"); font-weight:600; font-display:swap; }
  @font-face { font-family:"Assistant"; src:url("/fonts/Assistant-Bold.woff2") format("woff2"); font-weight:700; font-display:swap; }

  html,body { overflow-x:hidden !important; max-width:100vw; scroll-behavior:smooth; }

  .lp { font-family:"Assistant","Segoe UI",system-ui,sans-serif; color:#1a1a2e; background:#fff; overflow-x:hidden; -webkit-font-smoothing:antialiased; }
  .lp *, .lp *::before, .lp *::after { box-sizing:border-box; margin:0; padding:0; }
  .lp a { color:inherit; text-decoration:none; }
  .lp-excali { font-family:"Excalifont",cursive; }

  /* ── Animations ──────────────────────────────────────── */
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(24px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes slideIn {
    from { opacity:0; transform:translateX(-16px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes scaleIn {
    from { opacity:0; transform:scale(.94); }
    to   { opacity:1; transform:scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes draw {
    from { stroke-dashoffset: 400; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes nodeAppear {
    from { opacity:0; transform:scale(0.7); }
    to   { opacity:1; transform:scale(1); }
  }
  @keyframes pulse {
    0%,100% { box-shadow:0 0 0 0 rgba(97,40,255,.4); }
    50%     { box-shadow:0 0 0 10px rgba(97,40,255,0); }
  }
  @keyframes gradShift {
    0%   { background-position:0% 50%; }
    50%  { background-position:100% 50%; }
    100% { background-position:0% 50%; }
  }

  .lp-fadein   { animation: fadeUp .55s ease both; }
  .lp-fadein-2 { animation: fadeUp .55s .12s ease both; }
  .lp-fadein-3 { animation: fadeUp .55s .24s ease both; }
  .lp-fadein-4 { animation: fadeUp .55s .36s ease both; }

  /* ── Highlight ───────────────────────────────────────── */
  .lp-mark {
    background:linear-gradient(120deg,rgba(158,138,255,.35) 0%,rgba(97,40,255,.25) 100%);
    border-radius:4px; padding:0 4px;
  }
  .lp-mark-y {
    background:linear-gradient(120deg,rgba(255,214,0,.42) 0%,rgba(255,190,0,.28) 100%);
    border-radius:4px; padding:0 4px;
  }

  /* ── Buttons ──────────────────────────────────────────── */
  .lp-btn {
    display:inline-flex; align-items:center; justify-content:center; gap:7px;
    padding:11px 24px; border-radius:9px; font-size:15px; font-weight:600;
    cursor:pointer; border:none; transition:all .18s; white-space:nowrap;
    font-family:"Assistant",inherit; letter-spacing:.1px;
  }
  .lp-btn-primary {
    background:linear-gradient(135deg,#7c4bff,#6128ff);
    color:#fff; box-shadow:0 4px 20px rgba(97,40,255,.3);
  }
  .lp-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(97,40,255,.48); }
  .lp-btn-outline { background:transparent; color:#6128ff; border:1.5px solid #6128ff; }
  .lp-btn-outline:hover { background:rgba(97,40,255,.06); transform:translateY(-1px); }
  .lp-btn-ghost { background:transparent; color:#444; border:1.5px solid #e0e0e0; }
  .lp-btn-ghost:hover { background:#f5f5f5; }
  .lp-btn-lg { padding:15px 36px; font-size:17px; border-radius:11px; }
  .lp-btn-white { background:#fff; color:#6128ff; box-shadow:0 4px 24px rgba(0,0,0,.18); }
  .lp-btn-white:hover { background:#f0ecff; transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,.22); }

  /* ── Nav ──────────────────────────────────────────────── */
  .lp-nav {
    position:sticky; top:0; z-index:100;
    display:flex; align-items:center; justify-content:space-between;
    padding:0 52px; height:66px;
    background:rgba(255,255,255,.95); backdrop-filter:blur(20px);
    border-bottom:1px solid rgba(0,0,0,.07);
  }
  .lp-nav-logo { display:flex; align-items:center; gap:9px; font-size:20px; font-weight:700; color:#111; font-family:"Excalifont",cursive; }
  .lp-nav-links { display:flex; align-items:center; gap:30px; }
  .lp-nav-links a { font-size:15px; color:#555; font-weight:500; transition:color .15s; }
  .lp-nav-links a:hover { color:#6128ff; }
  .lp-nav-btns { display:flex; gap:10px; }

  /* ── Hero ──────────────────────────────────────────────── */
  .lp-hero {
    text-align:center; padding:72px 24px 0;
    background:radial-gradient(ellipse 100% 70% at 50% -5%, rgba(97,40,255,.1) 0%, transparent 65%);
    position:relative; overflow:hidden;
  }
  .lp-hero::before {
    content:''; position:absolute; inset:0;
    background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='rgba(105,101,219,.12)'/%3E%3C/svg%3E") repeat;
    pointer-events:none;
  }
  .lp-hero-badge {
    display:inline-flex; align-items:center; gap:8px;
    background:linear-gradient(94deg,rgba(158,138,255,.18),rgba(127,96,255,.12));
    color:#6128ff; border:1px solid rgba(97,40,255,.22);
    border-radius:99px; padding:7px 20px; font-size:13px; font-weight:600;
    margin-bottom:28px; letter-spacing:.2px;
  }
  .lp-hero h1 {
    font-size:clamp(38px,5.5vw,72px); font-weight:800; line-height:1.06;
    letter-spacing:-1.5px; max-width:820px; margin:0 auto 22px; color:#0a0a18;
    font-family:"Assistant",sans-serif;
  }
  .lp-hero-sub {
    font-size:clamp(16px,1.9vw,20px); color:#666; max-width:560px;
    margin:0 auto 40px; line-height:1.65; font-weight:400;
  }
  .lp-hero-btns { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; margin-bottom:10px; }
  .lp-hero-note { font-size:13px; color:#bbb; letter-spacing:.1px; margin-bottom:52px; }

  /* ── Social proof bar ───────────────────────────────────── */
  .lp-social-bar {
    display:flex; align-items:center; justify-content:center; gap:32px; flex-wrap:wrap;
    padding:16px 24px 64px; max-width:700px; margin:0 auto;
  }
  .lp-social-item { display:flex; align-items:center; gap:8px; font-size:14px; color:#888; }
  .lp-social-dot { width:6px; height:6px; border-radius:50%; background:#e0e0e0; }

  /* ── Hero screenshot preview ──────────────────────────── */
  .lp-hero-preview {
    max-width:1200px; margin:0 auto; padding:0 24px; position:relative;
    animation:scaleIn .5s .3s ease both;
  }
  .lp-hero-preview-frame {
    border-radius:14px; overflow:hidden;
    border:1.5px solid #e4e0f5;
    box-shadow:0 2px 0 #ddd8f8, 0 32px 80px rgba(97,40,255,.18), 0 8px 24px rgba(0,0,0,.07);
    background:#f5f4ff;
  }
  .lp-hero-preview-bar {
    background:#f0efff; padding:9px 14px; border-bottom:1px solid #e8e5ff;
    display:flex; align-items:center; gap:10px;
  }
  .lp-hero-preview-dots { display:flex; gap:5px; }
  .lp-hero-preview-dot { width:10px; height:10px; border-radius:50%; }
  .lp-hero-preview-url {
    flex:1; background:rgba(255,255,255,.8); border:1px solid #ddd;
    border-radius:5px; padding:4px 10px; font-size:11px; color:#888; text-align:center;
  }
  .lp-hero-preview img { width:100%; display:block; }
  @media (max-width:640px) {
    .lp-hero-preview > div { flex-direction:column !important; }
  }

  /* ── Two tools section ───────────────────────────────────── */
  .lp-tools-section { padding:80px 24px; max-width:1100px; margin:0 auto; }
  .lp-tools-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:48px; }
  .lp-tool-card {
    border-radius:24px; padding:36px 32px; text-align:left; position:relative; overflow:hidden;
    border:1.5px solid transparent; transition:transform .2s, box-shadow .2s;
  }
  .lp-tool-card:hover { transform:translateY(-4px); }
  .lp-tool-card-canvas {
    background:linear-gradient(145deg,#f8f6ff 0%,#ece6ff 100%);
    border-color:#d8d0ff;
  }
  .lp-tool-card-canvas:hover { box-shadow:0 16px 48px rgba(97,40,255,.18); }
  .lp-tool-card-mindmap {
    background:linear-gradient(145deg,#f0fdf7 0%,#d1fae8 100%);
    border-color:#a7f3d0;
  }
  .lp-tool-card-mindmap:hover { box-shadow:0 16px 48px rgba(16,185,129,.18); }
  .lp-tool-card-head { display:flex; align-items:center; gap:14px; margin-bottom:16px; }
  .lp-tool-card-icon-wrap {
    width:56px; height:56px; border-radius:16px;
    display:flex; align-items:center; justify-content:center; font-size:28px; flex-shrink:0;
  }
  .lp-tool-card-canvas .lp-tool-card-icon-wrap { background:rgba(97,40,255,.12); }
  .lp-tool-card-mindmap .lp-tool-card-icon-wrap { background:rgba(16,185,129,.12); }
  .lp-tool-card h3 { font-size:22px; font-weight:800; color:#111; }
  .lp-tool-card-sub { font-size:13px; color:#888; font-weight:500; }
  .lp-tool-card p { font-size:15px; color:#555; line-height:1.7; margin-bottom:20px; }
  .lp-tool-card-feats { list-style:none; display:flex; flex-direction:column; gap:8px; }
  .lp-tool-card-feats li { font-size:13px; color:#444; display:flex; align-items:center; gap:8px; }
  .lp-tool-card-feats li::before {
    content:""; display:inline-block; width:16px; height:16px; border-radius:50%; flex-shrink:0;
    background:linear-gradient(135deg,#9E8AFF,#6128ff);
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='7' viewBox='0 0 9 7'%3E%3Cpath d='M1 3.5l2.5 2.5 4.5-5' stroke='white' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:center;
  }
  .lp-tool-card-mindmap .lp-tool-card-feats li::before {
    background:linear-gradient(135deg,#6ee7b7,#10b981);
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='7' viewBox='0 0 9 7'%3E%3Cpath d='M1 3.5l2.5 2.5 4.5-5' stroke='white' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:center;
  }
  .lp-tool-card-vis { margin-top:24px; border-radius:14px; overflow:hidden; border:1px solid rgba(0,0,0,.06); }

  /* ── Value strip ─────────────────────────────────────────── */
  .lp-value-strip {
    background:linear-gradient(135deg,#0d0025 0%,#1a0050 50%,#0d0025 100%);
    background-size:200% 200%;
    animation:gradShift 8s ease infinite;
    color:#fff; padding:56px 52px;
    display:flex; align-items:center; justify-content:center; gap:0; flex-wrap:wrap;
  }
  .lp-value-item { text-align:center; padding:16px 52px; position:relative; }
  .lp-value-item + .lp-value-item::before {
    content:''; position:absolute; left:0; top:50%; transform:translateY(-50%);
    height:40px; width:1px; background:rgba(255,255,255,.12);
  }
  .lp-value-n { font-size:44px; font-weight:400; color:#c4b5fd; letter-spacing:-1px; font-family:"Excalifont",cursive; line-height:1; }
  .lp-value-label { font-size:13px; color:rgba(255,255,255,.45); margin-top:6px; max-width:120px; line-height:1.4; }

  /* ── Pain → Gain section ─────────────────────────────────── */
  .lp-pain { padding:96px 52px; max-width:1100px; margin:0 auto; }
  .lp-pain-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:56px; }
  .lp-pain-before {
    background:linear-gradient(160deg,#fff8f8,#fff);
    border:1.5px solid #fecaca; border-radius:20px; padding:32px;
  }
  .lp-pain-after {
    background:linear-gradient(160deg,#f0fdf4,#fff);
    border:1.5px solid #a7f3d0; border-radius:20px; padding:32px;
  }
  .lp-pain-label {
    font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:1px;
    margin-bottom:20px; display:flex; align-items:center; gap:8px;
    padding-bottom:16px; border-bottom:1px solid rgba(0,0,0,.06);
  }
  .lp-pain-before .lp-pain-label { color:#dc2626; }
  .lp-pain-after .lp-pain-label { color:#059669; }
  .lp-pain-item { display:flex; gap:12px; align-items:flex-start; margin-bottom:16px; }
  .lp-pain-x { color:#ef4444; flex-shrink:0; font-size:16px; margin-top:1px; }
  .lp-pain-check { color:#10b981; flex-shrink:0; font-size:16px; margin-top:1px; }
  .lp-pain-text { font-size:14px; color:#555; line-height:1.6; }
  .lp-pain-after .lp-pain-text { color:#333; font-weight:500; }

  /* ── Features ───────────────────────────────────────────── */
  .lp-section { padding:96px 52px; max-width:1160px; margin:0 auto; }
  .lp-section-header { text-align:center; margin-bottom:60px; }
  .lp-section-tag {
    display:inline-flex; align-items:center; gap:6px;
    background:#f0ecff; color:#6128ff;
    border-radius:99px; padding:5px 16px; font-size:12px; font-weight:700;
    text-transform:uppercase; letter-spacing:.8px; margin-bottom:18px;
    border:1px solid rgba(97,40,255,.14);
  }
  .lp-section h2 { font-size:clamp(26px,3.2vw,44px); font-weight:800; letter-spacing:-.5px; margin-bottom:14px; color:#0a0a18; }
  .lp-section-sub { font-size:18px; color:#666; max-width:520px; margin:0 auto; line-height:1.65; }

  /* ── Feature grid ─────────────────────────────────────────── */
  .lp-feat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; background:#f0f0f8; border-radius:24px; overflow:hidden; border:1.5px solid #e4e0f5; }
  .lp-feat-cell { background:#fff; padding:36px 32px; transition:background .18s; }
  .lp-feat-cell:hover { background:#fafafe; }
  .lp-feat-cell-icon {
    width:56px; height:56px; border-radius:16px;
    display:flex; align-items:center; justify-content:center; font-size:28px; margin-bottom:20px;
    box-shadow:0 4px 12px rgba(0,0,0,.06);
  }
  .lp-feat-cell h3 { font-size:17px; font-weight:700; color:#111; margin-bottom:8px; }
  .lp-feat-cell p { font-size:14px; color:#666; line-height:1.65; }

  /* ── Templates visual section ─────────────────────────────── */
  .lp-templates-bg { background:#fafafe; border-top:1.5px solid #f0f0f8; border-bottom:1.5px solid #f0f0f8; padding:88px 0; }
  .lp-templates-inner { max-width:1100px; margin:0 auto; padding:0 52px; }
  .lp-templates-row { display:flex; gap:14px; overflow-x:auto; margin-top:48px; padding-bottom:8px; }
  .lp-templates-row::-webkit-scrollbar { height:4px; }
  .lp-templates-row::-webkit-scrollbar-track { background:#f0f0f8; border-radius:4px; }
  .lp-templates-row::-webkit-scrollbar-thumb { background:#c4b5fd; border-radius:4px; }
  .lp-tpl-card {
    flex-shrink:0; width:180px; border-radius:16px; overflow:hidden;
    border:1.5px solid #e8e6f5; background:#fff;
    transition:transform .18s, box-shadow .18s;
  }
  .lp-tpl-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(97,40,255,.14); }
  .lp-tpl-preview {
    height:110px; display:flex; align-items:center; justify-content:center;
    font-size:36px; border-bottom:1px solid #f0f0f8;
  }
  .lp-tpl-label { padding:10px 12px; font-size:12px; font-weight:700; color:#333; }
  .lp-tpl-sub { padding:0 12px 12px; font-size:11px; color:#aaa; line-height:1.4; }

  /* ── Split feature ──────────────────────────────────────────── */
  .lp-split {
    display:grid; grid-template-columns:1fr 1fr; gap:88px;
    align-items:center; padding:88px 52px; max-width:1160px; margin:0 auto;
  }
  .lp-split.rev .lp-split-text { order:2; }
  .lp-split.rev .lp-split-vis  { order:1; }
  .lp-split-text h2 { font-size:clamp(24px,2.8vw,40px); font-weight:800; letter-spacing:-.5px; margin-bottom:16px; color:#0a0a18; line-height:1.18; }
  .lp-split-text p  { font-size:16px; color:#666; line-height:1.75; margin-bottom:28px; }
  .lp-split-text ul { list-style:none; }
  .lp-split-text li {
    font-size:15px; color:#444; padding:10px 0;
    display:flex; align-items:center; gap:12px;
    border-bottom:1px solid #f0f0f8;
  }
  .lp-split-text li::before {
    content:""; display:inline-block; width:22px; height:22px; border-radius:50%; flex-shrink:0;
    background:linear-gradient(135deg,#9E8AFF,#6128ff);
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='9' viewBox='0 0 11 9'%3E%3Cpath d='M1 4.5l3.5 3.5 5.5-7' stroke='white' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:center;
  }
  .lp-split-vis {
    border-radius:24px; padding:40px;
    display:flex; align-items:center; justify-content:center; min-height:340px;
    border:1.5px solid; position:relative; overflow:hidden;
  }

  /* ── Steps ──────────────────────────────────────────────── */
  .lp-steps-bg { background:#06060f; padding:96px 0; }
  .lp-steps-inner { max-width:960px; margin:0 auto; padding:0 52px; }
  .lp-steps-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:48px; margin-top:60px; position:relative; }
  .lp-steps-grid::before {
    content:''; position:absolute; top:28px; left:calc(16.66% + 28px); right:calc(16.66% + 28px);
    height:2px; background:linear-gradient(90deg,#6128ff,#9e8aff,#6128ff);
    background-size:200% 100%; animation:gradShift 3s linear infinite;
  }
  .lp-step { text-align:center; }
  .lp-step-n {
    width:56px; height:56px; border-radius:50%;
    background:linear-gradient(135deg,#9E8AFF,#6128ff);
    color:#fff; display:flex; align-items:center; justify-content:center;
    font-size:22px; font-weight:800; margin:0 auto 20px;
    box-shadow:0 8px 28px rgba(97,40,255,.5);
    font-family:"Excalifont",cursive; position:relative; z-index:1;
    animation:pulse 3s ease infinite;
  }
  .lp-step:nth-child(2) .lp-step-n { animation-delay:.8s; }
  .lp-step:nth-child(3) .lp-step-n { animation-delay:1.6s; }
  .lp-step h3 { font-size:18px; font-weight:700; margin-bottom:10px; color:#fff; }
  .lp-step p  { font-size:14px; color:rgba(255,255,255,.45); line-height:1.7; }

  /* ── Testimonials ───────────────────────────────────────── */
  .lp-testi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  .lp-testi {
    background:#fff; border:1.5px solid #eaebf0; border-radius:20px; padding:28px 24px;
    transition:box-shadow .18s, transform .18s;
  }
  .lp-testi:hover { box-shadow:0 12px 40px rgba(97,40,255,.1); transform:translateY(-3px); }
  .lp-testi-stars { color:#6128ff; font-size:14px; margin-bottom:14px; letter-spacing:2px; }
  .lp-testi p { font-size:15px; color:#333; line-height:1.72; margin-bottom:20px; font-style:italic; }
  .lp-testi-author { display:flex; align-items:center; gap:12px; }
  .lp-testi-avatar {
    width:48px; height:48px; border-radius:50%;
    overflow:hidden; flex-shrink:0;
    border:2px solid #f0ecff;
    box-shadow:0 2px 8px rgba(97,40,255,.15);
  }
  .lp-testi-avatar img { width:100%; height:100%; object-fit:cover; display:block; }
  .lp-testi-name { font-size:14px; font-weight:700; color:#111; }
  .lp-testi-role { font-size:12px; color:#aaa; margin-top:2px; }

  /* ── Pricing ────────────────────────────────────────────── */
  .lp-pricing-wrap { background:#fafafe; padding:96px 0; border-top:1.5px solid #f0f0f8; }
  .lp-pricing-inner { max-width:820px; margin:0 auto; padding:0 52px; }
  .lp-pricing-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
  .lp-pcard { border:1.5px solid #eaebf0; border-radius:24px; padding:40px 32px; background:#fff; position:relative; transition:transform .2s, box-shadow .2s; }
  .lp-pcard:hover { transform:translateY(-4px); }
  .lp-pcard.featured { border-color:#6128ff; box-shadow:0 0 0 4px rgba(97,40,255,.1), 0 24px 64px rgba(97,40,255,.12); background:linear-gradient(160deg,#fff 0%,#faf8ff 100%); }
  .lp-pbadge { position:absolute; top:-14px; left:50%; transform:translateX(-50%); background:linear-gradient(94deg,#9E8AFF,#6128ff); color:#fff; padding:5px 20px; border-radius:99px; font-size:12px; font-weight:700; white-space:nowrap; box-shadow:0 4px 12px rgba(97,40,255,.35); }
  .lp-pcard h3 { font-size:20px; font-weight:800; margin-bottom:4px; color:#111; }
  .lp-pprice { font-size:56px; font-weight:800; color:#111; letter-spacing:-2px; margin:16px 0 4px; line-height:1; }
  .lp-pprice span { font-size:15px; font-weight:400; color:#888; }
  .lp-pdesc { font-size:14px; color:#777; margin-bottom:24px; }
  .lp-ptrial { font-size:13px; color:#6128ff; font-weight:600; margin-bottom:24px; background:#f0ecff; padding:8px 14px; border-radius:8px; }
  .lp-pfeats { list-style:none; margin-bottom:32px; }
  .lp-pfeats li { font-size:14px; padding:9px 0; border-bottom:1px solid #f5f5f5; display:flex; align-items:center; gap:10px; color:#444; }
  .lp-pfeats li::before {
    content:""; display:inline-block; width:20px; height:20px; border-radius:50%; flex-shrink:0;
    background:linear-gradient(135deg,#9E8AFF,#6128ff);
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='8' viewBox='0 0 10 8'%3E%3Cpath d='M1 4l3 3 5-6' stroke='white' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:center;
  }

  /* ── For whom ───────────────────────────────────────────── */
  .lp-forwhom { padding:88px 52px; max-width:1100px; margin:0 auto; }
  .lp-forwhom-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-top:52px; }
  .lp-forwhom-card {
    border-radius:20px; padding:32px 24px; text-align:center;
    border:1.5px solid #e8e6f5; background:#fff;
    transition:transform .2s, box-shadow .2s;
  }
  .lp-forwhom-card:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(97,40,255,.1); }
  .lp-forwhom-icon { font-size:40px; margin-bottom:14px; }
  .lp-forwhom-card h3 { font-size:16px; font-weight:700; color:#111; margin-bottom:8px; }
  .lp-forwhom-card p { font-size:13px; color:#777; line-height:1.6; }

  /* ── Benefits ───────────────────────────────────────────── */
  .lp-benefits-bg { background:linear-gradient(135deg,#06060f 0%,#1a0050 100%); padding:88px 52px; }
  .lp-benefits-inner { max-width:960px; margin:0 auto; }
  .lp-benefits-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:52px; }
  .lp-benefit {
    display:flex; gap:16px; align-items:flex-start;
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08);
    border-radius:16px; padding:24px;
  }
  .lp-benefit-icon { font-size:28px; flex-shrink:0; margin-top:2px; }
  .lp-benefit h3 { font-size:16px; font-weight:700; color:#fff; margin-bottom:6px; }
  .lp-benefit p { font-size:14px; color:rgba(255,255,255,.5); line-height:1.6; }

  /* ── Differential ───────────────────────────────────────── */
  .lp-diff { padding:88px 52px; max-width:900px; margin:0 auto; text-align:center; }
  .lp-diff-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:52px; }
  .lp-diff-card {
    border-radius:20px; padding:36px 28px;
    background:linear-gradient(145deg,#f8f6ff,#ece6ff);
    border:1.5px solid #ddd6ff;
  }
  .lp-diff-icon { font-size:36px; margin-bottom:14px; }
  .lp-diff-card h3 { font-size:16px; font-weight:700; color:#111; margin-bottom:8px; }
  .lp-diff-card p { font-size:13px; color:#666; line-height:1.65; }

  /* ── FAQ ─────────────────────────────────────────────────── */
  .lp-faq { padding:88px 52px; max-width:760px; margin:0 auto; }
  .lp-faq-item { border-bottom:1.5px solid #f0f0f8; padding:20px 0; }
  .lp-faq-item h3 { font-size:17px; font-weight:700; color:#111; margin-bottom:10px; display:flex; align-items:flex-start; gap:10px; }
  .lp-faq-item h3::before { content:"?"; display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,#9E8AFF,#6128ff); color:#fff; font-size:12px; font-weight:800; flex-shrink:0; margin-top:2px; }
  .lp-faq-item p { font-size:15px; color:#666; line-height:1.7; padding-left:34px; }

  /* ── CTA ─────────────────────────────────────────────────── */
  .lp-cta {
    background:linear-gradient(135deg,#2d0a8e 0%,#6128ff 50%,#8b5cf6 100%);
    background-size:200% 200%; animation:gradShift 6s ease infinite;
    color:#fff; text-align:center; padding:112px 48px; position:relative; overflow:hidden;
  }
  .lp-cta::before {
    content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse 70% 60% at 50% 120%,rgba(255,255,255,.15) 0%,transparent 65%);
  }
  .lp-cta-inner { position:relative; z-index:1; max-width:680px; margin:0 auto; }
  .lp-cta h2 { font-size:clamp(32px,4.5vw,58px); font-weight:800; letter-spacing:-.8px; margin-bottom:16px; line-height:1.1; }
  .lp-cta p  { font-size:19px; opacity:.82; margin-bottom:44px; line-height:1.65; }
  .lp-cta-note { font-size:13px; opacity:.45; margin-top:16px; }
  .lp-cta-trust { display:flex; align-items:center; justify-content:center; gap:24px; margin-top:24px; flex-wrap:wrap; }
  .lp-cta-trust span { font-size:13px; opacity:.55; display:flex; align-items:center; gap:6px; }

  /* ── Footer ──────────────────────────────────────────────── */
  .lp-footer { background:#06060f; color:#fff; padding:64px 52px 28px; }
  .lp-footer-top { display:flex; flex-wrap:wrap; gap:48px; justify-content:space-between; margin-bottom:52px; }
  .lp-footer-logo { font-size:22px; font-weight:400; color:#b8a4ff; margin-bottom:10px; display:flex; align-items:center; gap:8px; font-family:"Excalifont",cursive; }
  .lp-footer-desc { font-size:14px; color:rgba(255,255,255,.28); max-width:220px; line-height:1.65; }
  .lp-footer-col h4 { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,.28); margin-bottom:16px; }
  .lp-footer-col a, .lp-footer-col button { display:block; font-size:14px; color:rgba(255,255,255,.45); margin-bottom:10px; background:none; border:none; cursor:pointer; font-family:inherit; text-align:left; padding:0; transition:color .15s; }
  .lp-footer-col a:hover, .lp-footer-col button:hover { color:#fff; }
  .lp-footer-bottom { border-top:1px solid rgba(255,255,255,.06); padding-top:24px; font-size:13px; color:rgba(255,255,255,.18); text-align:center; }

  /* ── AI Section ──────────────────────────────────────────── */
  .lp-ai-section {
    background: linear-gradient(160deg, #0a001f 0%, #1a0050 50%, #06060f 100%);
    padding: 100px 24px; position: relative; overflow: hidden;
  }
  .lp-ai-section::before {
    content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
    width: 800px; height: 800px; border-radius: 50%;
    background: radial-gradient(circle, rgba(124,75,255,.18) 0%, transparent 70%);
    pointer-events: none;
  }
  .lp-ai-inner { max-width: 1100px; margin: 0 auto; position: relative; z-index: 1; }
  .lp-ai-header { text-align: center; margin-bottom: 64px; }
  .lp-ai-tag {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(94deg, rgba(124,75,255,.25), rgba(97,40,255,.15));
    color: #c4b5fd; border: 1px solid rgba(196,181,253,.3);
    border-radius: 99px; padding: 8px 22px; font-size: 13px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .8px; margin-bottom: 20px;
  }
  .lp-ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
  .lp-ai-card {
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
    border-radius: 24px; padding: 36px 32px; position: relative; overflow: hidden;
    transition: border-color .2s, background .2s;
  }
  .lp-ai-card:hover { border-color: rgba(196,181,253,.3); background: rgba(255,255,255,.06); }
  .lp-ai-card-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: linear-gradient(94deg, #7c4bff, #6128ff);
    color: #fff; border-radius: 99px; padding: 4px 14px;
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px;
    margin-bottom: 20px;
  }
  .lp-ai-card h3 { font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 10px; }
  .lp-ai-card > p { font-size: 15px; color: rgba(255,255,255,.5); line-height: 1.7; margin-bottom: 24px; }
  .lp-ai-steps { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .lp-ai-step-item {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,.05); border-radius: 10px; padding: 10px 14px;
  }
  .lp-ai-step-num {
    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, #9e8aff, #6128ff);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; color: #fff;
  }
  .lp-ai-step-item span { font-size: 13px; color: rgba(255,255,255,.7); }

  /* AI mockup animations */
  @keyframes aiTyping {
    0%,100% { width: 0; } 60%,80% { width: 100%; }
  }
  @keyframes aiCard {
    0% { opacity:0; transform:translateY(12px) scale(.96); }
    100% { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes aiPulse {
    0%,100% { opacity: .4; } 50% { opacity: 1; }
  }
  @keyframes aiNode {
    0% { opacity:0; transform:scale(0); }
    100% { opacity:1; transform:scale(1); }
  }
  @keyframes aiLine {
    from { stroke-dashoffset: 80; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes sparkle {
    0%,100% { transform: scale(1) rotate(0deg); opacity:.8; }
    50% { transform: scale(1.2) rotate(15deg); opacity:1; }
  }

  .lp-ai-mockup {
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
    border-radius: 16px; overflow: hidden; margin-top: 8px;
  }
  .lp-ai-mockup-bar {
    background: rgba(255,255,255,.06); padding: 8px 14px;
    display: flex; align-items: center; gap: 8px;
    border-bottom: 1px solid rgba(255,255,255,.07);
  }
  .lp-ai-mockup-dot { width: 8px; height: 8px; border-radius: 50%; }
  .lp-ai-mockup-title { font-size: 11px; color: rgba(255,255,255,.3); margin-left: auto; margin-right: auto; }
  .lp-ai-mockup-body { padding: 16px; }

  /* Responsive AI */
  @media (max-width:900px) { .lp-ai-grid { grid-template-columns: 1fr; } }

  /* ── Responsive ──────────────────────────────────────────── */
  @media (max-width:1024px) {
    .lp-feat-grid { grid-template-columns:repeat(2,1fr); }
    .lp-testi-grid { grid-template-columns:1fr 1fr; }
  }
  @media (max-width:900px) {
    .lp-split { grid-template-columns:1fr; gap:40px; padding:56px 24px; }
    .lp-split.rev { direction:ltr; }
    .lp-steps-grid { grid-template-columns:1fr; gap:36px; }
    .lp-steps-grid::before { display:none; }
    .lp-pricing-grid { grid-template-columns:1fr; }
    .lp-pain-grid { grid-template-columns:1fr; }
    .lp-tools-grid { grid-template-columns:1fr; }
    .lp-demo-body { grid-template-columns:1fr; }
    .lp-demo-sidebar { display:none; }
    .lp-testi-grid { grid-template-columns:1fr; }
    .lp-forwhom-grid { grid-template-columns:repeat(2,1fr); }
    .lp-benefits-grid { grid-template-columns:1fr; }
    .lp-diff-grid { grid-template-columns:1fr; }
  }
  @media (max-width:768px) {
    .lp-nav { padding:0 20px; height:60px; }
    .lp-nav-links { display:none; }
    .lp-hero { padding:52px 20px 0; }
    .lp-section { padding:56px 20px; }
    .lp-pain { padding:56px 20px; }
    .lp-steps-inner { padding:0 20px; }
    .lp-cta { padding:72px 24px; }
    .lp-footer { padding:48px 20px 24px; }
    .lp-value-strip { gap:0; padding:40px 16px; }
    .lp-value-item { padding:12px 24px; }
    .lp-value-item + .lp-value-item::before { display:none; }
    .lp-pricing-inner { padding:0 20px; }
    .lp-tools-section { padding:56px 20px; }
    .lp-feat-grid { grid-template-columns:1fr; }
    .lp-templates-inner { padding:0 20px; }
    .lp-forwhom-grid { grid-template-columns:1fr; }
    .lp-forwhom { padding:56px 20px; }
    .lp-benefits-bg { padding:56px 20px; }
    .lp-diff { padding:56px 20px; }
    .lp-faq { padding:56px 20px; }
  }

  /* ── Inline signup form ──────────────────────────────────────────── */
  .lp-signup-section {
    background:linear-gradient(135deg,#2d0a8e 0%,#6128ff 50%,#8b5cf6 100%);
    background-size:200% 200%; animation:gradShift 6s ease infinite;
    padding:96px 24px; position:relative; overflow:hidden;
  }
  .lp-signup-section::before {
    content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse 70% 60% at 50% 120%,rgba(255,255,255,.15) 0%,transparent 65%);
    pointer-events:none;
  }
  .lp-signup-inner { position:relative; z-index:1; max-width:460px; margin:0 auto; text-align:center; }
  .lp-signup-inner h2 { font-size:clamp(28px,4vw,48px); font-weight:800; letter-spacing:-.8px; color:#fff; margin-bottom:12px; line-height:1.1; }
  .lp-signup-inner > p { font-size:17px; color:rgba(255,255,255,.7); margin-bottom:36px; line-height:1.6; }
  .lp-signup-card {
    background:rgba(255,255,255,.97); border-radius:20px; padding:36px 32px;
    box-shadow:0 24px 80px rgba(0,0,0,.3);
  }
  .lp-signup-card label { display:block; text-align:left; font-size:13px; font-weight:700; color:#444; margin-bottom:6px; }
  .lp-signup-card input {
    width:100%; padding:13px 16px; border:1.5px solid #e0e0e0; border-radius:10px;
    font-size:15px; font-family:inherit; outline:none; transition:border-color .15s;
    margin-bottom:16px; color:#111;
  }
  .lp-signup-card input:focus { border-color:#6128ff; box-shadow:0 0 0 3px rgba(97,40,255,.12); }
  .lp-signup-card input::placeholder { color:#bbb; }
  .lp-signup-submit {
    width:100%; padding:15px; background:linear-gradient(135deg,#7c4bff,#6128ff);
    color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:700;
    cursor:pointer; font-family:inherit; transition:all .18s; margin-top:4px;
    box-shadow:0 4px 20px rgba(97,40,255,.4);
  }
  .lp-signup-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 32px rgba(97,40,255,.5); }
  .lp-signup-submit:disabled { opacity:.65; cursor:default; }
  .lp-signup-error { color:#dc2626; font-size:13px; margin-bottom:12px; text-align:left; background:#fff5f5; border:1px solid #fecaca; border-radius:8px; padding:8px 12px; }
  .lp-signup-success { color:#059669; font-size:14px; text-align:center; background:#f0fdf4; border:1px solid #a7f3d0; border-radius:10px; padding:16px; font-weight:600; }
  .lp-signup-toggle { font-size:13px; color:#888; margin-top:16px; }
  .lp-signup-toggle button { background:none; border:none; color:#6128ff; font-weight:700; cursor:pointer; font-family:inherit; font-size:13px; padding:0; }
  .lp-signup-trust { display:flex; align-items:center; justify-content:center; gap:20px; margin-top:24px; flex-wrap:wrap; }
  .lp-signup-trust span { font-size:12px; color:rgba(255,255,255,.55); display:flex; align-items:center; gap:5px; }
`;

// ── Hero screenshot preview ────────────────────────────────────────────────────

const SCREENSHOT_WHITEBOARD = "https://res.cloudinary.com/dkny2qqeu/image/upload/v1776703746/hf_20260420_162838_d64ad83e-86f0-4746-8730-aed1620dce67_qkks1j.png";
const SCREENSHOT_MINDMAP    = "https://res.cloudinary.com/dkny2qqeu/image/upload/v1776703745/hf_20260420_164353_f88124b6-426d-4a34-b40c-794f75ad269d_udlq3f.png";

const BrowserFrame = ({ url, src, alt, eager }: { url: string; src: string; alt: string; eager?: boolean }) => (
  <div className="lp-hero-preview-frame" style={{ flex: 1, minWidth: 0 }}>
    <div className="lp-hero-preview-bar">
      <div className="lp-hero-preview-dots">
        <div className="lp-hero-preview-dot" style={{ background: "#ff5f57" }} />
        <div className="lp-hero-preview-dot" style={{ background: "#febc2e" }} />
        <div className="lp-hero-preview-dot" style={{ background: "#28c840" }} />
      </div>
      <div className="lp-hero-preview-url">{url}</div>
    </div>
    <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} />
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

// ── Main component ─────────────────────────────────────────────────────────────

export const LandingPage: React.FC<Props> = ({ onLogin, onSignup, onGuest }) => {
  const goSignup = () => {
    document.getElementById("registro")?.scrollIntoView({ behavior: "smooth" });
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    // Fire Lead when user hits submit (before result)
    pixelLead(email);
    try {
      const { error } = await signUpWithEmail(email, password);
      if (error) throw error;
      pixelRegistration(email);
      onLogin();
    } catch (err: any) {
      setFormError(err.message || "Ocurrió un error.");
      setFormLoading(false);
    }
  };

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const prev = {
      ho: html.style.overflow, hh: html.style.height,
      bo: body.style.overflow, bh: body.style.height,
      rh: root?.style.height ?? "", ro: root?.style.overflow ?? "",
    };
    html.style.overflow = "auto"; html.style.height = "auto";
    body.style.overflow = "auto"; body.style.height = "auto";
    if (root) { root.style.height = "auto"; root.style.overflow = "visible"; }
    return () => {
      html.style.overflow = prev.ho; html.style.height = prev.hh;
      body.style.overflow = prev.bo; body.style.height = prev.bh;
      if (root) { root.style.height = prev.rh; root.style.overflow = prev.ro; }
    };
  }, []);

  return (
    <div className="lp">
      <style>{css}</style>

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#6128ff" />
            <path d="M6 20L11 13L15 17L22 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
          <button className="lp-btn lp-btn-ghost" style={{ fontSize: 14, padding: "8px 18px" }} onClick={onLogin}>
            Iniciar sesión
          </button>
          <button className="lp-btn lp-btn-primary" style={{ fontSize: 14, padding: "8px 18px" }} onClick={goSignup}>
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
          <span className="lp-mark">crea clases visuales y organizadas</span><br />
          en minutos desde un solo lugar
        </h1>
        <p className="lp-hero-sub lp-fadein-3">
          Ahora con IA integrada para resumir, organizar y transformar tus ideas automáticamente.<br />
          Diseñado para profesores y creadores de cursos que quieren enseñar mejor sin perder tiempo ni usar múltiples herramientas.
        </p>
        <div className="lp-hero-btns lp-fadein-3">
          <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={goSignup}>
            🚀 Crear mi primera clase ahora (gratis)
          </button>
          <button className="lp-btn lp-btn-ghost lp-btn-lg" onClick={onGuest ?? onLogin}>
            Ver cómo funciona →
          </button>
        </div>
        <p className="lp-hero-note lp-fadein-4">7 días con acceso completo · Después el acceso se limita · Sin tarjeta de crédito</p>

        {/* Social proof inline */}
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
      <div style={{ background: "linear-gradient(180deg,#fafafe 0%,#fff 100%)", borderTop: "1.5px solid #f0f0f8" }}>
        <div className="lp-pain">
          <div className="lp-section-header">
            <div className="lp-section-tag">😩 El problema real</div>
            <h2 style={{ fontSize: "clamp(26px,3.2vw,44px)", fontWeight: 800, letterSpacing: "-.5px", color: "#0a0a18" }}>
              Si cada clase te toma más tiempo<br />del que debería…
            </h2>
            <div style={{ maxWidth: 560, margin: "20px auto 0", background: "#fff8f8", border: "1.5px solid #fecaca", borderRadius: 16, padding: "24px 28px", textAlign: "left" }}>
              {[
                "Pasas más tiempo organizando que enseñando",
                "Saltás entre 3 o 5 herramientas para preparar una sola clase",
                "Tus ideas están, pero no lográs estructurarlas bien",
                "Terminás improvisando porque todo está disperso",
              ].map((t) => (
                <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                  <span style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }}>✕</span>
                  <span style={{ fontSize: 15, color: "#555", lineHeight: 1.6 }}>{t}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #fecaca", fontSize: 15, fontWeight: 700, color: "#dc2626" }}>
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
            <h2 style={{ fontSize: "clamp(30px,3.8vw,52px)", fontWeight: 800, letterSpacing: "-.8px", color: "#fff", lineHeight: 1.1, margin: "0 auto 16px", maxWidth: 700 }}>
              Describí tu tema.<br />
              <span style={{ background: "linear-gradient(90deg,#c4b5fd,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>La IA crea la base de tu clase.</span>
            </h2>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,.5)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
              Menos tiempo pensando cómo organizar. Más tiempo enseñando.
            </p>
          </div>

          <div className="lp-ai-grid">
            {/* AI WHITEBOARD */}
            <div className="lp-ai-card">
              <div className="lp-ai-card-badge">✨ IA Pizarra</div>
              <h3>Pegá texto o un PDF → Pizarrón visual listo</h3>
              <p>La IA resume automáticamente tu contenido y lo organiza en tarjetas visuales estructuradas sobre el canvas, listas para enseñar.</p>
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
              {/* Animated mockup */}
              <div className="lp-ai-mockup">
                <div className="lp-ai-mockup-bar">
                  <div className="lp-ai-mockup-dot" style={{ background: "#ff5f57" }} />
                  <div className="lp-ai-mockup-dot" style={{ background: "#febc2e" }} />
                  <div className="lp-ai-mockup-dot" style={{ background: "#28c840" }} />
                  <div className="lp-ai-mockup-title">✨ Generando pizarrón…</div>
                </div>
                <div className="lp-ai-mockup-body">
                  {/* Input area */}
                  <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 12, color: "rgba(255,255,255,.45)", fontStyle: "italic" }}>
                    "La fotosíntesis: proceso, etapas, cloroplastos…"
                    <span style={{ display: "inline-block", width: 2, height: 12, background: "#c4b5fd", marginLeft: 2, animation: "aiPulse 1s ease infinite", verticalAlign: "middle" }} />
                  </div>
                  {/* Generated cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { color: "#dcfce7", label: "Proceso", delay: ".1s" },
                      { color: "#dbeafe", label: "Etapas", delay: ".3s" },
                      { color: "#fce7f3", label: "Cloroplasto", delay: ".5s" },
                    ].map((c) => (
                      <div key={c.label} style={{ background: c.color, borderRadius: 8, padding: "10px 8px", animation: `aiCard .5s ${c.delay} ease both` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#333", marginBottom: 6 }}>{c.label}</div>
                        {[1,2,3].map((n) => (
                          <div key={n} style={{ height: 5, background: "rgba(0,0,0,.12)", borderRadius: 3, marginBottom: 4, width: n === 2 ? "70%" : "90%" }} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI MINDMAP */}
            <div className="lp-ai-card">
              <div className="lp-ai-card-badge" style={{ background: "linear-gradient(94deg,#059669,#10b981)" }}>✨ IA Mapa Mental</div>
              <h3>Un tema → Mapa mental completo</h3>
              <p>Escribí un tema y la IA genera una estructura clara con nodos, ramas y conexiones. Vos decidís cómo enseñarlo — la IA organiza, vos enseñás.</p>
              <div className="lp-ai-steps">
                {[
                  "Escribís el tema o pegás tu texto",
                  "La IA genera la estructura de nodos",
                  "Editás, personalizás y enseñás",
                ].map((s, i) => (
                  <div key={s} className="lp-ai-step-item">
                    <div className="lp-ai-step-num" style={{ background: "linear-gradient(135deg,#6ee7b7,#10b981)" }}>{i + 1}</div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              {/* Animated mindmap mockup */}
              <div className="lp-ai-mockup">
                <div className="lp-ai-mockup-bar">
                  <div className="lp-ai-mockup-dot" style={{ background: "#ff5f57" }} />
                  <div className="lp-ai-mockup-dot" style={{ background: "#febc2e" }} />
                  <div className="lp-ai-mockup-dot" style={{ background: "#28c840" }} />
                  <div className="lp-ai-mockup-title">✨ Generando mapa mental…</div>
                </div>
                <div className="lp-ai-mockup-body" style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px 16px" }}>
                  <svg width="100%" viewBox="0 0 280 160" style={{ overflow: "visible" }}>
                    {/* Lines */}
                    {[
                      { x1:140,y1:80, x2:40,y2:30 }, { x1:140,y1:80, x2:40,y2:80 }, { x1:140,y1:80, x2:40,y2:130 },
                      { x1:140,y1:80, x2:240,y2:30 }, { x1:140,y1:80, x2:240,y2:80 }, { x1:140,y1:80, x2:240,y2:130 },
                    ].map((l, i) => (
                      <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                        stroke="rgba(196,181,253,.4)" strokeWidth="1.5" strokeDasharray="80"
                        style={{ animation: `aiLine .4s ${i * .08}s ease forwards`, strokeDashoffset: 80 }} />
                    ))}
                    {/* Center node */}
                    <rect x="105" y="65" width="70" height="30" rx="8" fill="#7c4bff"
                      style={{ animation: "aiNode .3s ease both" }} />
                    <text x="140" y="84" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">FOTOSÍNTESIS</text>
                    {/* Branch nodes */}
                    {[
                      { x:8, y:18, label:"Luz solar", color:"#dbeafe", tc:"#1e40af", delay:".2s" },
                      { x:8, y:68, label:"CO₂", color:"#dcfce7", tc:"#166534", delay:".3s" },
                      { x:8, y:118, label:"Agua H₂O", color:"#fce7f3", tc:"#9d174d", delay:".4s" },
                      { x:202, y:18, label:"Glucosa", color:"#fef9c3", tc:"#92400e", delay:".25s" },
                      { x:202, y:68, label:"Clorofila", color:"#ede9fe", tc:"#5b21b6", delay:".35s" },
                      { x:202, y:118, label:"O₂", color:"#ffedd5", tc:"#c2410c", delay:".45s" },
                    ].map((n) => (
                      <g key={n.label} style={{ animation: `aiNode .35s ${n.delay} ease both` }}>
                        <rect x={n.x} y={n.y} width="70" height="24" rx="6" fill={n.color} />
                        <text x={n.x + 35} y={n.y + 15} textAnchor="middle" fill={n.tc} fontSize="8" fontWeight="600">{n.label}</text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div style={{ textAlign: "center", marginTop: 52 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(196,181,253,.1)", border: "1px solid rgba(196,181,253,.2)", borderRadius: 12, padding: "12px 24px", marginBottom: 28, flexWrap: "wrap", justifyContent: "center" }}>
              {["✨ IA incluida en plan Pro", "📄 Texto, tema o PDF", "🤖 La IA organiza, vos enseñás"].map((f) => (
                <span key={f} style={{ fontSize: 13, color: "rgba(255,255,255,.65)", fontWeight: 600 }}>{f}</span>
              ))}
            </div>
            <br />
            <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={goSignup} style={{ fontSize: 16, boxShadow: "0 8px 40px rgba(124,75,255,.5)", animation: "sparkle 3s ease infinite" }}>
              ✨ Probar la IA gratis 7 días →
            </button>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.3)", marginTop: 12 }}>Sin tarjeta de crédito · Después el acceso se limita</p>
          </div>
        </div>
      </div>

      {/* ── BEFORE / AFTER VISUAL ── */}
      <div style={{ background: "#06060f", padding: "72px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div className="lp-section-tag" style={{ background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.65)", borderColor: "rgba(255,255,255,.12)" }}>
            🔄 La transformación
          </div>
          <h2 style={{ fontSize: "clamp(26px,3.2vw,40px)", fontWeight: 800, letterSpacing: "-.5px", margin: "18px 0 40px", color: "#fff", lineHeight: 1.15 }}>
            Así se ve preparar una clase<br /><span style={{ color: "#c4b5fd" }}>antes y después de EduDraw</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 20, alignItems: "center" }}>
            <div style={{ background: "rgba(239,68,68,.1)", border: "1.5px solid rgba(239,68,68,.3)", borderRadius: 20, padding: "28px 24px", textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "#f87171", marginBottom: 16 }}>❌ Antes</div>
              {["Ideas sueltas, herramientas separadas", "3 o 5 apps abiertas para preparar una clase", "Tiempo perdido organizando, no enseñando", "Clase improvisada, sin estructura clara"].map((t) => (
                <div key={t} style={{ fontSize: 14, color: "rgba(255,255,255,.55)", marginBottom: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: "#f87171", flexShrink: 0 }}>—</span>{t}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 32, color: "#c4b5fd", fontWeight: 800 }}>→</div>
            <div style={{ background: "rgba(16,185,129,.1)", border: "1.5px solid rgba(16,185,129,.3)", borderRadius: 20, padding: "28px 24px", textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "#6ee7b7", marginBottom: 16 }}>✅ Después</div>
              {["Clase clara, visual y lista en minutos", "Un solo lugar para todo, con IA incluida", "Estructura automática desde tu texto", "Entrás al aula con confianza y orden"].map((t) => (
                <div key={t} style={{ fontSize: 14, color: "rgba(255,255,255,.75)", marginBottom: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: "#6ee7b7", flexShrink: 0 }}>✓</span>{t}
                </div>
              ))}
            </div>
          </div>
          <button className="lp-btn lp-btn-white lp-btn-lg" onClick={goSignup} style={{ marginTop: 40, fontSize: 16 }}>
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
        <h2 style={{ fontSize: "clamp(26px,3.2vw,44px)", fontWeight: 800, letterSpacing: "-.5px", margin: "18px 0 12px", color: "#0a0a18" }}>
          Menos herramientas.<br />Más claridad. <span className="lp-mark">Mejores clases.</span>
        </h2>
        <p className="lp-section-sub">A diferencia de otras plataformas, EduDraw está pensado para enseñar — no solo para diseñar.</p>
        <div className="lp-diff-grid">
          {[
            { icon: "🚫", title: "Sin combinar 3 o 5 apps", desc: "No necesitás Canva para el diseño, Notion para las notas y Miro para los mapas. Acá tenés todo junto." },
            { icon: "✨", title: "La IA te ayuda a estructurar tus ideas", desc: "No tenés que organizar todo manualmente. Pegás el contenido y la IA genera la estructura por vos automáticamente." },
            { icon: "🎓", title: "Todo pensado para enseñar", desc: "Cada función fue diseñada para el flujo de trabajo de un profesor: organizar → visualizar → enseñar." },
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
      <div style={{ background: "#fafafe", borderTop: "1.5px solid #f0f0f8", borderBottom: "1.5px solid #f0f0f8" }}>
        <div className="lp-forwhom">
          <div className="lp-section-header">
            <div className="lp-section-tag">👩‍🏫 ¿Para quién es?</div>
            <h2 style={{ fontSize: "clamp(26px,3.2vw,44px)", fontWeight: 800, letterSpacing: "-.5px", color: "#0a0a18" }}>
              Para profesores y creadores de cursos<br />que quieren <span className="lp-mark">enseñar mejor sin perder tiempo</span>
            </h2>
          </div>
          <div className="lp-forwhom-grid">
            {[
              { icon: "👩‍🏫", title: "Profesores online", desc: "Crea clases visuales que enganchen a tus alumnos y se vean profesionales desde el primer día." },
              { icon: "🎓", title: "Creadores de cursos", desc: "Estructura tus módulos con mapas mentales y diseña el contenido visual en la misma herramienta." },
              { icon: "🧑‍💼", title: "Coaches y formadores", desc: "Organiza tus sesiones, frameworks y metodologías de forma visual y clara para tus clientes." },
              { icon: "📚", title: "Cualquier persona que enseña", desc: "Si tienes algo que enseñar y quieres hacerlo de forma más clara y organizada, esta herramienta es para ti." },
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
          <h2>Lo que dicen quienes<br /><span className="lp-mark">ya enseñan con EduDraw</span></h2>
          <p className="lp-section-sub">Más de 500 profesores y creadores de cursos en Latinoamérica.</p>
        </div>
        <div className="lp-testi-grid">
          {[
            { photo: "https://i.pravatar.cc/80?img=47", name: "María González", role: "Profesora online, Buenos Aires", text: "Ahora preparo mis clases en la mitad del tiempo. La IA me ayuda a organizar todo mucho más rápido y todo se ve mucho más claro." },
            { photo: "https://i.pravatar.cc/80?img=33", name: "Carlos Ruiz", role: "Creador de cursos, Asunción", text: "Antes usaba varias herramientas, ahora hago todo en un solo lugar. Pegás el texto y la IA te da la estructura lista para enseñar." },
            { photo: "https://i.pravatar.cc/80?img=16", name: "Laura Martínez", role: "Coach educativa, Montevideo", text: "Me ayudó a organizar mis ideas y enseñar mejor sin complicarme. Mis clientes dicen que mis sesiones son mucho más claras ahora." },
            { photo: "https://i.pravatar.cc/80?img=12", name: "Andrés Pérez", role: "Formador corporativo, Lima", text: "Lo que más me sorprendió fue lo simple que es. En 5 minutos ya estaba creando mi primera clase con la IA generando la estructura." },
            { photo: "https://i.pravatar.cc/80?img=25", name: "Sofía Torres", role: "Profesora universitaria, Bogotá", text: "Uso la IA para estructurar el módulo y la pizarra para explicarlo en clase. Antes tardaba horas — ahora en minutos tengo la base lista." },
            { photo: "https://i.pravatar.cc/80?img=52", name: "Javier Moreno", role: "Instructor de marketing, Santiago", text: "Mis alumnos dicen que mis clases son más fáciles de entender desde que empecé a usar EduDraw. La diferencia es notable." },
          ].map((t) => (
            <div key={t.name} className="lp-testi">
              <div className="lp-testi-stars">★★★★★</div>
              <p>"{t.text}"</p>
              <div className="lp-testi-author">
                <div className="lp-testi-avatar">
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
            <h2 style={{ fontSize: "clamp(26px,3.2vw,44px)", fontWeight: 800, letterSpacing: "-.5px", color: "#0a0a18" }}>
              Menos de lo que cuesta<br /><span className="lp-mark">un café al mes</span>
            </h2>
            <p className="lp-section-sub" style={{ marginBottom: 20 }}>Accedé a una herramienta que reemplaza varias plataformas y te ahorra horas cada semana.</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#fef9c3", border: "1.5px solid #fde68a", borderRadius: 12, padding: "10px 20px", fontSize: 14, color: "#92400e", fontWeight: 600 }}>
              ⏳ Tenés 7 días con acceso completo. Después, el acceso se limita. Suficiente para probar. Difícil volver atrás.
            </div>
          </div>
          <div className="lp-pricing-grid">
            <div className="lp-pcard">
              <h3>Free</h3>
              <div className="lp-pprice">$0 <span>/ mes</span></div>
              <p className="lp-pdesc">Para empezar sin compromiso</p>
              <p className="lp-ptrial">🎁 7 días con acceso completo · IA incluida · Sin tarjeta · Después el acceso se limita</p>
              <ul className="lp-pfeats">
                <li>2 documentos (pizarras o mapas)</li>
                <li>Guardado automático en la nube</li>
                <li>Exportar PNG y SVG</li>
                <li>Todas las plantillas de mapas mentales</li>
                <li>Compartir por link de solo lectura</li>
              </ul>
              <button className="lp-btn lp-btn-outline" style={{ width: "100%", padding: 14 }} onClick={goSignup}>
                Empezar gratis →
              </button>
            </div>
            <div className="lp-pcard featured">
              <div className="lp-pbadge">✨ Más popular</div>
              <h3>Pro</h3>
              <div className="lp-pprice">$6 <span>/ mes</span></div>
              <p className="lp-pdesc">Para docentes que quieren crear sin límites ni estrés</p>
              <p className="lp-ptrial" style={{ background: "rgba(97,40,255,.08)", borderColor: "rgba(97,40,255,.2)", color: "#5b21b6" }}>
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
              <button className="lp-btn lp-btn-primary" style={{ width: "100%", padding: 14 }}
                onClick={() => { pixelInitCheckout(); window.open("https://pay.hotmart.com/E105478979P", "_blank"); }}>
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
            <h2 style={{ fontSize: "clamp(26px,3.2vw,44px)", fontWeight: 800, letterSpacing: "-.5px", color: "#0a0a18" }}>
              Todo lo que querías saber<br /><span className="lp-mark">antes de empezar</span>
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
          <h2>Empieza gratis y crea<br />tu primera clase hoy</h2>
          <p>
            Accedé a todas las funciones durante 7 días y descubrí lo fácil que puede ser
            crear clases claras, visuales y bien organizadas.
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
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com" required autoComplete="email" />

              <label>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="mín. 8 caracteres" required minLength={8} autoComplete="new-password" />

              {formError && <div className="lp-signup-error">{formError}</div>}

              <button type="submit" disabled={formLoading} className="lp-signup-submit">
                {formLoading ? "Creando tu cuenta…" : "🚀 Crear mi cuenta gratis"}
              </button>

              <p style={{ fontSize: 12, color: "#999", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
                Después de probarlo, podés seguir usando la herramienta en modo limitado
                o desbloquear todo para seguir creando sin límites.<br />
                <strong style={{ color: "#6128ff" }}>💥 Suficiente para probar. Difícil volver atrás.</strong>
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
                <path d="M6 20L11 13L15 17L22 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              EduDraw
            </div>
            <p className="lp-footer-desc">Pizarra libre y mapas mentales en un solo lugar. Para educadores que quieren enseñar de forma más visual.</p>
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
            <button onClick={onLogin}>Iniciar sesión</button>
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
};
