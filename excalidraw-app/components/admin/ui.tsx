// Lightweight admin design-system (shadcn-like look, no Tailwind).
// Inline styles only, to match the existing codebase and avoid touching the
// Excalidraw editor's global CSS.
import type { CSSProperties, ReactNode } from "react";

export const tokens = {
  radius: 14,
  border: "1px solid #ececf3",
  cardShadow: "0 1px 2px rgba(16,24,40,0.05)",
  bg: "#fff",
  muted: "#6b7280",
  fg: "#111827",
  accent: "#6128ff",
  accentSoft: "#f0eeff",
  pageBg: "#f4f3ff",
  font: "Assistant, system-ui, sans-serif",
};

export const Card = ({ children, style, onClick }: { children: ReactNode; style?: CSSProperties; onClick?: () => void }) => (
  <div
    onClick={onClick}
    style={{
      background: tokens.bg,
      border: tokens.border,
      borderRadius: tokens.radius,
      boxShadow: tokens.cardShadow,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Section = ({ title, description, right, children, style }: {
  title?: string; description?: string; right?: ReactNode; children: ReactNode; style?: CSSProperties;
}) => (
  <Card style={{ padding: "22px 24px", ...style }}>
    {(title || right) && (
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: description ? 4 : 18, gap: 12 }}>
        <div>
          {title && <div style={{ fontSize: 16, fontWeight: 700, color: tokens.fg, letterSpacing: -0.2 }}>{title}</div>}
          {description && <div style={{ fontSize: 13, color: tokens.muted, marginTop: 2 }}>{description}</div>}
        </div>
        {right}
      </div>
    )}
    {description && <div style={{ height: 14 }} />}
    {children}
  </Card>
);

type BadgeTone = "default" | "success" | "warning" | "danger" | "muted" | "accent";
const badgeColors: Record<BadgeTone, { bg: string; color: string }> = {
  default: { bg: "#f3f4f6", color: "#374151" },
  success: { bg: "#d1fae5", color: "#065f46" },
  warning: { bg: "#fef9c3", color: "#92400e" },
  danger:  { bg: "#fee2e2", color: "#991b1b" },
  muted:   { bg: "#f3f4f6", color: "#9ca3af" },
  accent:  { bg: "#ede9fe", color: "#5b21b6" },
};

export const Badge = ({ tone = "default", children }: { tone?: BadgeTone; children: ReactNode }) => {
  const c = badgeColors[tone];
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
};

export const Button = ({ children, onClick, variant = "primary", disabled, style }: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "outline"; disabled?: boolean; style?: CSSProperties;
}) => {
  const variants: Record<string, CSSProperties> = {
    primary: { background: tokens.accent, color: "#fff", border: "none" },
    ghost:   { background: tokens.accentSoft, color: tokens.accent, border: "none" },
    outline: { background: "#fff", color: "#374151", border: tokens.border },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600,
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1,
        fontFamily: tokens.font, ...variants[variant], ...style,
      }}>
      {children}
    </button>
  );
};

// Refined metric card
export const Metric = ({ label, value, sub, accent, tone }: {
  label: string; value: ReactNode; sub?: ReactNode; accent?: string; tone?: "up" | "down" | "neutral";
}) => (
  <Card style={{ padding: "18px 20px", flex: "1 1 180px", minWidth: 180 }}>
    <div style={{ fontSize: 12, color: tokens.muted, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: accent ?? tokens.fg, marginTop: 6, letterSpacing: -0.5 }}>{value}</div>
    {sub != null && (
      <div style={{ fontSize: 12, color: tone === "up" ? "#059669" : tone === "down" ? "#dc2626" : tokens.muted, marginTop: 4 }}>{sub}</div>
    )}
  </Card>
);

export const money = (value: number, currency = "USD") => {
  const symbol = currency === "BRL" ? "R$" : currency === "USD" ? "US$" : currency === "EUR" ? "€" : `${currency} `;
  return `${symbol}${value.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};
