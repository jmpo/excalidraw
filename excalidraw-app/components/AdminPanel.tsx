import { useEffect, useState } from "react";
import {
  supabase,
  signOut,
  fetchAllProfiles,
  adminSetPlan,
  adminExtendTrial,
  adminFetchUserDrawings,
  getEffectivePlan,
  isTrialActive,
  trialDaysLeft,
} from "../data/supabase";
import type { Drawing } from "../data/supabase";
import { useAuth } from "../auth/AuthContext";
import type { AdminProfile, Plan } from "../data/supabase";

// ── Plan badge ────────────────────────────────────────────────────────────────

const PlanBadge = ({ profile }: { profile: AdminProfile }) => {
  const effective = getEffectivePlan(profile);
  const trial = isTrialActive(profile);
  const days = trialDaysLeft(profile);
  const colors: Record<string, { bg: string; color: string }> = {
    pro:    { bg: "#d1fae5", color: "#065f46" },
    trial:  { bg: "#fef3c7", color: "#92400e" },
    free:   { bg: "#f3f4f6", color: "#6b7280" },
    paused: { bg: "#fee2e2", color: "#991b1b" },
  };
  const c = colors[effective] ?? colors.free;
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color }}>
        {effective.toUpperCase()}
      </span>
      {trial && (
        <span style={{ fontSize: 11, color: "#92400e" }}>{days}d left</span>
      )}
      {profile.plan === "trial" && !trial && (
        <span style={{ fontSize: 11, color: "#e53e3e" }}>Expirado</span>
      )}
    </span>
  );
};

// ── User detail modal ─────────────────────────────────────────────────────────

const UserDetailModal = ({
  user,
  onClose,
  onUpdated,
}: {
  user: AdminProfile;
  onClose: () => void;
  onUpdated: () => void;
}) => {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [drawings, setDrawings] = useState<Drawing[] | null>(null);
  const [loadingDrawings, setLoadingDrawings] = useState(false);

  const loadDrawings = async () => {
    setLoadingDrawings(true);
    try {
      const d = await adminFetchUserDrawings(user.id);
      setDrawings(d);
    } catch { setDrawings([]); }
    finally { setLoadingDrawings(false); }
  };

  const setPlan = async (plan: Plan) => {
    setSaving(true);
    setMsg("");
    try {
      await adminSetPlan(user.id, plan, 7);
      setMsg("Plan actualizado ✓");
      onUpdated();
    } catch { setMsg("Error al actualizar."); }
    finally { setSaving(false); }
  };

  const extendTrial = async (days: number) => {
    setSaving(true);
    setMsg("");
    try {
      await adminExtendTrial(user.id, days);
      setMsg(`Trial extendido +${days}d ✓`);
      onUpdated();
    } catch { setMsg("Error al extender."); }
    finally { setSaving(false); }
  };

  const effectivePlan = getEffectivePlan(user);
  const trial = isTrialActive(user);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "32px 36px", width: 500, maxWidth: "95vw", boxShadow: "0 12px 48px rgba(0,0,0,0.2)", fontFamily: "Assistant, system-ui, sans-serif" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>
              {user.full_name || "Sin nombre"}
            </div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{user.email}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999" }}>×</button>
        </div>

        {/* Info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "📞 Teléfono", value: user.phone || "—" },
            { label: "🏢 Industria", value: user.industry || "—" },
            { label: "🎯 Caso de uso", value: user.use_case || "—" },
            { label: "📐 Dibujos", value: String(user.drawing_count) },
            { label: "📅 Registrado", value: fmtDate(user.created_at) },
            { label: "⏱ Trial hasta", value: user.trial_ends_at ? fmtDate(user.trial_ends_at) : "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "#f8f7ff", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 11, color: "#999", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Plan section */}
        <div style={{ borderTop: "1px solid #f0eeff", paddingTop: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            Plan y suscripción
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            <PlanBadge profile={user} />
            {(["free", "trial", "pro"] as Plan[]).map((p) => (
              <button key={p} onClick={() => setPlan(p)} disabled={saving}
                style={{
                  padding: "5px 14px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: effectivePlan === p ? "#6128ff" : "#f0eeff",
                  color: effectivePlan === p ? "#fff" : "#6128ff",
                }}>
                {p === "free" ? "Expirado" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Extend trial */}
          <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 6 }}>
            Extender trial:
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[3, 7, 14, 30].map((d) => (
              <button key={d} onClick={() => extendTrial(d)} disabled={saving}
                style={{
                  padding: "5px 14px", borderRadius: 7, border: "1.5px solid #e0e0f0",
                  background: "#fafafa", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#555",
                }}>
                +{d}d
              </button>
            ))}
          </div>
        </div>

        {msg && (
          <div style={{ padding: "8px 14px", background: msg.includes("Error") ? "#fff0f0" : "#f0fff4", borderRadius: 8, fontSize: 12, color: msg.includes("Error") ? "#e53e3e" : "#22543d", fontWeight: 600 }}>
            {msg}
          </div>
        )}

        {/* Drawings section */}
        <div style={{ borderTop: "1px solid #f0eeff", paddingTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Dibujos del usuario
            </div>
            {drawings === null && (
              <button
                onClick={loadDrawings}
                disabled={loadingDrawings}
                style={{ fontSize: 11, fontWeight: 700, color: "#6128ff", background: "#f0eeff", border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}
              >
                {loadingDrawings ? "Cargando..." : "Ver dibujos →"}
              </button>
            )}
          </div>

          {drawings !== null && (
            drawings.length === 0 ? (
              <div style={{ fontSize: 12, color: "#bbb", textAlign: "center", padding: "12px 0" }}>Sin dibujos</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                {drawings.map((d) => (
                  <div key={d.id} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #ede9fe", background: "#fafafa" }}>
                    <div style={{ height: 70, background: "#f3f0ff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {d.thumbnail ? (
                        <img src={d.thumbnail} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 22 }}>{d.type === "mindmap" ? "🧠" : "📐"}</span>
                      )}
                    </div>
                    <div style={{ padding: "5px 7px" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name || "Sin título"}</div>
                      <div style={{ fontSize: 10, color: "#aaa" }}>{new Date(d.updated_at).toLocaleDateString("es")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

// ── Types ─────────────────────────────────────────────────────────────────────

const PRO_PRICE = 64.9; // USD — update if price changes

type Stats = {
  totalUsers: number;
  newUsersWeek: number;
  newUsersMonth: number;
  totalGuests: number;
  activeGuestsWeek: number;
  activeGuestsToday: number;
  totalDrawings: number;
  avgDrawingsPerUser: number;
  avgGuestElements: number;
  planCounts: Record<string, number>;
};

type RecentUser = {
  id: string;
  email: string;
  created_at: string;
  drawing_count: number;
};

type GuestRow = {
  session_id: string;
  created_at: string;
  last_active: string;
  element_count: number;
  tool?: "canvas" | "mindmap" | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("es-AR");

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const getOnboardingStatus = (u: AdminProfile): { label: string; bg: string; color: string } => {
  if (!u.onboarding_done) return { label: "⏳ Pendiente", bg: "#f3f4f6", color: "#6b7280" };
  if (!u.full_name) return { label: "⏭ Omitió", bg: "#fef9c3", color: "#92400e" };
  const createdMs = new Date(u.created_at).getTime();
  const gotExtension = u.trial_ends_at
    ? new Date(u.trial_ends_at).getTime() > createdMs + 8 * 86400000
    : false;
  if (gotExtension) return { label: "🎁 +3d obtenidos", bg: "#d1fae5", color: "#065f46" };
  return { label: "✅ Completó", bg: "#e0f2fe", color: "#0284c7" };
};

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  sub,
  color = "#6128ff",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon: string;
}) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 14,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      borderTop: `3px solid ${color}`,
      minWidth: 160,
      flex: 1,
    }}
  >
    <div style={{ fontSize: 22 }}>{icon}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e" }}>
      {fmt(Number(value))}
    </div>
    <div style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: "#999" }}>{sub}</div>}
  </div>
);

// ── Funnel bar ────────────────────────────────────────────────────────────────

const FunnelBar = ({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 5,
          fontSize: 13,
        }}
      >
        <span style={{ color: "#444", fontWeight: 600 }}>{label}</span>
        <span style={{ color: "#888" }}>
          {fmt(value)} ({pct}%)
        </span>
      </div>
      <div
        style={{
          background: "#f0eeff",
          borderRadius: 6,
          height: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 6,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
};

// ── AdminPanel ────────────────────────────────────────────────────────────────

export const AdminPanel = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [allProfiles, setAllProfiles] = useState<AdminProfile[]>([]);
  const [activeGuests, setActiveGuests] = useState<GuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "users" | "guests">("overview");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<AdminProfile | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
        const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
        const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();

            const [
          { count: totalUsers },
          { count: newUsersWeek },
          { count: newUsersMonth },
          { count: totalGuests },
          { count: activeGuestsWeek },
          { count: activeGuestsToday },
          { count: totalDrawings },
          { data: guestElements },
          { data: guestsData },
          profiles,
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", monthAgo),
          supabase.from("guest_sessions").select("*", { count: "exact", head: true }),
          supabase.from("guest_sessions").select("*", { count: "exact", head: true }).gte("last_active", weekAgo),
          supabase.from("guest_sessions").select("*", { count: "exact", head: true }).gte("last_active", todayStart),
          supabase.from("drawings").select("*", { count: "exact", head: true }),
          supabase.from("guest_sessions").select("element_count").gt("element_count", 0),
          supabase.from("guest_sessions").select("session_id, created_at, last_active, element_count").order("last_active", { ascending: false }).limit(50),
          fetchAllProfiles(),
        ]);

        const avgDrawings = profiles.length > 0
          ? Math.round(profiles.reduce((a, p) => a + p.drawing_count, 0) / profiles.length)
          : 0;

        const elCounts = (guestElements || []).map((g: any) => g.element_count);
        const avgElements = elCounts.length > 0
          ? Math.round(elCounts.reduce((a: number, b: number) => a + b, 0) / elCounts.length)
          : 0;

        const planCounts: Record<string, number> = { free: 0, trial: 0, pro: 0, paused: 0 };
        profiles.forEach((p) => {
          const ep = getEffectivePlan(p);
          planCounts[ep] = (planCounts[ep] || 0) + 1;
        });

        setStats({
          totalUsers: totalUsers ?? 0,
          newUsersWeek: newUsersWeek ?? 0,
          newUsersMonth: newUsersMonth ?? 0,
          totalGuests: totalGuests ?? 0,
          activeGuestsWeek: activeGuestsWeek ?? 0,
          activeGuestsToday: activeGuestsToday ?? 0,
          totalDrawings: totalDrawings ?? 0,
          avgDrawingsPerUser: avgDrawings,
          avgGuestElements: avgElements,
          planCounts,
        });
        setAllProfiles(profiles);
        setActiveGuests(guestsData || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const reloadProfiles = () => fetchAllProfiles().then(setAllProfiles);

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (user?.email !== "pompa.07@gmail.com") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontSize: 16,
          color: "#e53e3e",
        }}
      >
        Acceso denegado.
      </div>
    );
  }

  const conversionRate =
    stats && stats.totalGuests > 0
      ? Math.round((stats.totalUsers / stats.totalGuests) * 100)
      : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (<>
    {selectedUser && (
      <UserDetailModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onUpdated={() => { reloadProfiles(); setSelectedUser(null); }}
      />
    )}
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        background: "#f4f3ff",
        fontFamily: "Assistant, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e1f5",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              color: "#6128ff",
            }}
          >
            ←
          </button>
          <div>
            <div
              style={{ fontWeight: 800, fontSize: 18, color: "#1a1a2e" }}
            >
              Panel de Administración
            </div>
            <div style={{ fontSize: 12, color: "#999" }}>EduDraw · {user.email}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {(["overview", "users", "guests"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "7px 16px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                background: tab === t ? "#6128ff" : "#f0eeff",
                color: tab === t ? "#fff" : "#6128ff",
                transition: "all 0.15s",
              }}
            >
              {t === "overview" ? "Resumen" : t === "users" ? "Usuarios" : "Guests"}
            </button>
          ))}
          <button
            onClick={() => signOut()}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "1px solid #eee",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#999",
            }}
          >
            Salir
          </button>
        </div>
      </div>

      <div style={{ padding: "32px 32px", maxWidth: 1200, margin: "0 auto" }}>
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: 80,
              color: "#6128ff",
              fontSize: 16,
            }}
          >
            Cargando métricas...
          </div>
        ) : (
          <>
            {/* ── Overview ── */}
            {tab === "overview" && stats && (
              <>
                {/* Stats cards */}
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    flexWrap: "wrap",
                    marginBottom: 28,
                  }}
                >
                  <StatCard
                    icon="👤"
                    label="Usuarios registrados"
                    value={stats.totalUsers}
                    sub={`+${stats.newUsersWeek} esta semana`}
                    color="#6128ff"
                  />
                  <StatCard
                    icon="🆕"
                    label="Nuevos este mes"
                    value={stats.newUsersMonth}
                    sub="últimos 30 días"
                    color="#3b82f6"
                  />
                  <StatCard
                    icon="👻"
                    label="Sesiones guest"
                    value={stats.totalGuests}
                    sub={`${stats.activeGuestsToday} activos hoy`}
                    color="#f59e0b"
                  />
                  <StatCard
                    icon="📐"
                    label="Dibujos creados"
                    value={stats.totalDrawings}
                    sub={`~${stats.avgDrawingsPerUser} por usuario`}
                    color="#10b981"
                  />
                  <StatCard
                    icon="🔁"
                    label="Conversión"
                    value={`${conversionRate}%`}
                    sub="guests → registrados"
                    color="#ef4444"
                  />
                  <StatCard
                    icon="💰"
                    label="MRR estimado"
                    value={`$${(stats.planCounts.pro * PRO_PRICE).toFixed(0)}`}
                    sub={`${stats.planCounts.pro} usuarios Pro`}
                    color="#059669"
                  />
                </div>

                {/* Plan breakdown */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
                  {[
                    { plan: "free",   label: "Expirado", icon: "⏰", bg: "#f3f4f6", color: "#6b7280" },
                    { plan: "trial",  label: "Trial",  icon: "🚀", bg: "#fef3c7", color: "#92400e" },
                    { plan: "pro",    label: "Pro",    icon: "⭐", bg: "#d1fae5", color: "#065f46" },
                    { plan: "paused", label: "Paused", icon: "⏸", bg: "#fee2e2", color: "#991b1b" },
                  ].map(({ plan, label, icon, bg, color }) => (
                    <div key={plan} style={{ background: bg, borderRadius: 12, padding: "16px 20px", cursor: "pointer" }}
                      onClick={() => { setPlanFilter(plan); setTab("users"); }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color }}>{stats.planCounts[plan] ?? 0}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color, marginTop: 2 }}>{label}</div>
                      <div style={{ fontSize: 11, color, opacity: 0.7, marginTop: 2 }}>ver usuarios →</div>
                    </div>
                  ))}
                </div>

                {/* Two column: funnel + activity */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 20,
                    marginBottom: 28,
                  }}
                >
                  {/* Funnel */}
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: "24px 28px",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        marginBottom: 20,
                        color: "#1a1a2e",
                      }}
                    >
                      Embudo de conversión
                    </div>
                    <FunnelBar
                      label="Visitantes guest"
                      value={stats.totalGuests}
                      max={stats.totalGuests}
                      color="#f59e0b"
                    />
                    <FunnelBar
                      label="Guests activos (7 días)"
                      value={stats.activeGuestsWeek}
                      max={stats.totalGuests}
                      color="#3b82f6"
                    />
                    <FunnelBar
                      label="Usuarios registrados"
                      value={stats.totalUsers}
                      max={stats.totalGuests}
                      color="#6128ff"
                    />
                    <div
                      style={{
                        marginTop: 16,
                        padding: "10px 14px",
                        background: "#f0eeff",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "#6128ff",
                      }}
                    >
                      💡 Promedio de{" "}
                      <strong>{stats.avgGuestElements} elementos</strong> dibujados
                      por sesión guest
                    </div>
                  </div>

                  {/* Weekly activity */}
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: "24px 28px",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        marginBottom: 20,
                        color: "#1a1a2e",
                      }}
                    >
                      Actividad reciente (7 días)
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                      }}
                    >
                      {[
                        {
                          label: "Nuevos registros",
                          value: stats.newUsersWeek,
                          icon: "👤",
                          color: "#6128ff",
                        },
                        {
                          label: "Guests activos",
                          value: stats.activeGuestsWeek,
                          icon: "👻",
                          color: "#f59e0b",
                        },
                        {
                          label: "Guests hoy",
                          value: stats.activeGuestsToday,
                          icon: "⚡",
                          color: "#10b981",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            background: "#fafaf9",
                            borderRadius: 10,
                            border: "1px solid #f0eeff",
                          }}
                        >
                          <span style={{ fontSize: 13, color: "#555" }}>
                            {item.icon} {item.label}
                          </span>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: 20,
                              color: item.color,
                            }}
                          >
                            {fmt(item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent users preview */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    padding: "24px 28px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}
                    >
                      Últimos registros
                    </div>
                    <button
                      onClick={() => setTab("users")}
                      style={{
                        fontSize: 12,
                        color: "#6128ff",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Ver todos →
                    </button>
                  </div>
                  <UserTable onSelect={setSelectedUser} users={allProfiles.slice(0, 5)} />
                </div>
              </>
            )}

            {/* ── Users tab ── */}
            {tab === "users" && (
              <div style={{ background: "#fff", borderRadius: 14, padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>
                    Usuarios registrados ({allProfiles.length})
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["all", "free", "trial", "pro", "paused"] as const).map((f) => (
                      <button key={f} onClick={() => setPlanFilter(f)}
                        style={{ padding: "5px 12px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                          background: planFilter === f ? "#6128ff" : "#f0eeff",
                          color: planFilter === f ? "#fff" : "#6128ff" }}>
                        {f === "all" ? "Todos" : f === "free" ? "Expirado" : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <UserTable
                  onSelect={setSelectedUser}
                  users={planFilter === "all" ? allProfiles : allProfiles.filter((u) => {
                    const ep = getEffectivePlan(u);
                    return planFilter === "paused" ? u.plan === "paused" : ep === planFilter;
                  })}
                />
              </div>
            )}

            {/* ── Guests tab ── */}
            {tab === "guests" && (
              <>
                {/* Tool interest summary */}
                {activeGuests.length > 0 && (() => {
                  const canvasCount = activeGuests.filter(g => !g.tool || g.tool === "canvas").length;
                  const mindmapCount = activeGuests.filter(g => g.tool === "mindmap").length;
                  const total = activeGuests.length;
                  const canvasPct = Math.round((canvasCount / total) * 100);
                  const mindmapPct = Math.round((mindmapCount / total) * 100);
                  return (
                    <div style={{ background: "#fff", borderRadius: 14, padding: "20px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e", marginBottom: 14 }}>
                        📊 Interés por herramienta
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1, background: "#ede9fe", borderRadius: 12, padding: "14px 18px" }}>
                          <div style={{ fontSize: 24, fontWeight: 800, color: "#5b21b6" }}>{canvasPct}%</div>
                          <div style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600 }}>🎨 Pizarra</div>
                          <div style={{ fontSize: 11, color: "#a78bfa" }}>{canvasCount} sesiones</div>
                        </div>
                        <div style={{ flex: 1, background: "#dcfce7", borderRadius: 12, padding: "14px 18px" }}>
                          <div style={{ fontSize: 24, fontWeight: 800, color: "#166534" }}>{mindmapPct}%</div>
                          <div style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>🧠 Mapa mental</div>
                          <div style={{ fontSize: 11, color: "#4ade80" }}>{mindmapCount} sesiones</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div style={{ background: "#fff", borderRadius: 14, padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: "#1a1a2e" }}>
                    Sesiones guest recientes ({activeGuests.length})
                  </div>
                  <GuestTable guests={activeGuests} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  </>);
};

// ── UserTable ─────────────────────────────────────────────────────────────────

const UserTable = ({
  users,
  onSelect,
}: {
  users: AdminProfile[];
  onSelect?: (u: AdminProfile) => void;
}) => (
  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
    <thead>
      <tr style={{ borderBottom: "2px solid #f0eeff" }}>
        {["Nombre / Email", "Plan", "Onboarding", "Registrado", "Dibujos", "Vencimiento", "Días restantes"].map((h) => (
          <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#888", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {h}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {users.map((u) => {
        const daysLeft = trialDaysLeft(u);
        const trialActive = isTrialActive(u);
        const trialExpired = u.plan === "trial" && !trialActive && !!u.trial_ends_at;
        return (
        <tr key={u.id} style={{ borderBottom: "1px solid #f5f5f5", cursor: onSelect ? "pointer" : "default" }}
          onClick={() => onSelect?.(u)}
          onMouseEnter={(e) => { if (onSelect) (e.currentTarget as HTMLElement).style.background = "#fafaf9"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
          <td style={{ padding: "10px 12px" }}>
            <div style={{ fontWeight: 600, color: "#222" }}>{u.full_name || "—"}</div>
            <div style={{ fontSize: 11, color: "#999" }}>{u.email}</div>
          </td>
          <td style={{ padding: "10px 12px" }}>
            <PlanBadge profile={u} />
          </td>
          <td style={{ padding: "10px 12px" }}>
            {(() => { const s = getOnboardingStatus(u); return (
              <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
                {s.label}
              </span>
            ); })()}
          </td>
          <td style={{ padding: "10px 12px", color: "#666" }}>{fmtDate(u.created_at)}</td>
          <td style={{ padding: "10px 12px" }}>
            <span style={{ background: u.drawing_count > 0 ? "#e0f2fe" : "#f5f5f5", color: u.drawing_count > 0 ? "#0284c7" : "#aaa", padding: "2px 10px", borderRadius: 20, fontWeight: 700, fontSize: 12 }}>
              {u.drawing_count}
            </span>
          </td>
          <td style={{ padding: "10px 12px", color: "#666", fontSize: 12 }}>
            {u.trial_ends_at ? fmtDate(u.trial_ends_at) : "—"}
          </td>
          <td style={{ padding: "10px 12px" }}>
            {u.plan === "pro" ? (
              <span style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>∞ Pro</span>
            ) : trialActive ? (
              <span style={{ background: daysLeft <= 2 ? "#fef9c3" : "#dcfce7", color: daysLeft <= 2 ? "#92400e" : "#166534", padding: "2px 10px", borderRadius: 20, fontWeight: 700, fontSize: 12 }}>
                {daysLeft}d
              </span>
            ) : trialExpired ? (
              <span style={{ background: "#fee2e2", color: "#991b1b", padding: "2px 10px", borderRadius: 20, fontWeight: 700, fontSize: 12 }}>
                Expirado
              </span>
            ) : (
              <span style={{ fontSize: 11, color: "#bbb" }}>—</span>
            )}
          </td>
        </tr>
        );
      })}
    </tbody>
  </table>
);

// ── GuestTable ────────────────────────────────────────────────────────────────

const GuestTable = ({ guests }: { guests: GuestRow[] }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
    <thead>
      <tr style={{ borderBottom: "2px solid #f0eeff" }}>
        {["Session ID", "Herramienta", "Primera visita", "Última actividad", "Elementos"].map(
          (h) => (
            <th
              key={h}
              style={{
                textAlign: "left",
                padding: "8px 12px",
                color: "#888",
                fontWeight: 600,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {h}
            </th>
          ),
        )}
      </tr>
    </thead>
    <tbody>
      {guests.map((g) => (
        <tr key={g.session_id} style={{ borderBottom: "1px solid #f5f5f5" }}>
          <td style={{ padding: "10px 12px", color: "#aaa", fontFamily: "monospace", fontSize: 11 }}>
            {g.session_id.slice(0, 16)}...
          </td>
          <td style={{ padding: "10px 12px" }}>
            {g.tool === "mindmap" ? (
              <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 10px", borderRadius: 20, fontWeight: 700, fontSize: 12 }}>🧠 Mapa mental</span>
            ) : (
              <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "2px 10px", borderRadius: 20, fontWeight: 700, fontSize: 12 }}>🎨 Pizarra</span>
            )}
          </td>
          <td style={{ padding: "10px 12px", color: "#666" }}>
            {fmtDate(g.created_at)}
          </td>
          <td style={{ padding: "10px 12px", color: "#666" }}>
            {relativeTime(g.last_active)}
          </td>
          <td style={{ padding: "10px 12px" }}>
            <span
              style={{
                background:
                  g.element_count > 5
                    ? "#fef3c7"
                    : g.element_count > 0
                      ? "#f0fdf4"
                      : "#f5f5f5",
                color:
                  g.element_count > 5
                    ? "#d97706"
                    : g.element_count > 0
                      ? "#16a34a"
                      : "#aaa",
                padding: "2px 10px",
                borderRadius: 20,
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {g.element_count}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
