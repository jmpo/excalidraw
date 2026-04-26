import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { detectSessionInUrl: true, persistSession: true },
});

// ── Plan types ────────────────────────────────────────────────────────────────

export type Plan = "free" | "trial" | "pro" | "paused";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  industry: string | null;
  use_case: string | null;
  plan: Plan;
  trial_ends_at: string | null;
  onboarding_done: boolean;
  created_at: string;
};

export const getEffectivePlan = (profile: Pick<Profile, "plan" | "trial_ends_at">): Plan => {
  if (profile.plan === "trial" && profile.trial_ends_at) {
    if (new Date(profile.trial_ends_at) < new Date()) return "free";
  }
  return profile.plan;
};

export const isPaused = (profile: Pick<Profile, "plan">): boolean =>
  profile.plan === "paused";

export const isTrialActive = (profile: Pick<Profile, "plan" | "trial_ends_at">): boolean =>
  profile.plan === "trial" &&
  !!profile.trial_ends_at &&
  new Date(profile.trial_ends_at) > new Date();

export const trialDaysLeft = (profile: Pick<Profile, "trial_ends_at">): number => {
  if (!profile.trial_ends_at) return 0;
  const ms = new Date(profile.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
};

export type Folder = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type DrawingType = "canvas" | "mindmap" | "mermaid";

export type Drawing = {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  type: DrawingType;
  content: { elements: unknown[]; appState: Record<string, unknown>; files?: Record<string, unknown> } | null;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export const signInWithEmail = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUpWithEmail = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export const signOut = async (opts?: { scope?: "global" | "local" | "others" }) => {
  await supabase.auth.signOut(opts);
  window.location.href = "https://edudraw.chatea.click";
};

export const resetPasswordForEmail = (email: string) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/?reset_password=1`,
  });

export const getSession = () => supabase.auth.getSession();

// ── Drawings CRUD ─────────────────────────────────────────────────────────────

export const fetchDrawings = async (): Promise<Drawing[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];
  const { data, error } = await supabase
    .from("drawings")
    .select("id, user_id, folder_id, name, type, thumbnail, created_at, updated_at")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data as Drawing[];
};

export const fetchDrawing = async (id: string): Promise<Drawing> => {
  const { data, error } = await supabase
    .from("drawings")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    throw error;
  }
  return data as Drawing;
};

export class DrawingLimitError extends Error {
  constructor() {
    super("DRAWING_LIMIT_REACHED");
    this.name = "DrawingLimitError";
  }
}

export const createDrawing = async (
  name: string,
  type: DrawingType = "canvas",
): Promise<Drawing> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("drawings")
    .insert({ name, user_id: user?.id, type })
    .select()
    .single();
  if (error) {
    if (error.message?.includes("DRAWING_LIMIT_REACHED")) throw new DrawingLimitError();
    throw error;
  }
  return data as Drawing;
};

export const saveDrawing = async (
  id: string,
  content: Drawing["content"],
  thumbnail?: string,
) => {
  const { error } = await supabase
    .from("drawings")
    .update({ content, thumbnail, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    throw error;
  }
};

export const duplicateDrawing = async (id: string): Promise<Drawing> => {
  // Fetch full drawing including content
  const { data: src, error: fetchErr } = await supabase
    .from("drawings")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchErr || !src) throw fetchErr ?? new Error("Drawing not found");
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase
    .from("drawings")
    .insert({
      user_id: session!.user.id,
      folder_id: src.folder_id,
      name: `${src.name} (copia)`,
      type: src.type,
      content: src.content,
      thumbnail: src.thumbnail,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Drawing;
};

// ── Version history ───────────────────────────────────────────────────────────

export type DrawingVersion = {
  id: string;
  drawing_id: string;
  label: string | null;
  snapshot: Record<string, unknown>;
  created_at: string;
};

export const saveVersion = async (
  drawingId: string,
  snapshot: Record<string, unknown>,
  label?: string,
): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No autenticado");
  // Insert new version
  const { error: insertError } = await supabase.from("drawing_versions").insert({
    drawing_id: drawingId,
    user_id: session.user.id,
    label: label ?? null,
    snapshot,
  });
  if (insertError) throw insertError;
  // Keep only last 10 versions per drawing
  const { data: versions } = await supabase
    .from("drawing_versions")
    .select("id, created_at")
    .eq("drawing_id", drawingId)
    .order("created_at", { ascending: false });
  if (versions && versions.length > 10) {
    const toDelete = versions.slice(10).map((v: any) => v.id);
    await supabase.from("drawing_versions").delete().in("id", toDelete);
  }
};

export const getVersions = async (drawingId: string): Promise<DrawingVersion[]> => {
  const { data } = await supabase
    .from("drawing_versions")
    .select("id, drawing_id, label, created_at")
    .eq("drawing_id", drawingId)
    .order("created_at", { ascending: false });
  return (data ?? []) as DrawingVersion[];
};

export const getVersionSnapshot = async (versionId: string): Promise<Record<string, unknown> | null> => {
  const { data } = await supabase
    .from("drawing_versions")
    .select("snapshot")
    .eq("id", versionId)
    .single();
  return (data as any)?.snapshot ?? null;
};

export const deleteVersion = async (versionId: string): Promise<void> => {
  await supabase.from("drawing_versions").delete().eq("id", versionId);
};

export const touchDrawing = async (id: string) => {
  await supabase
    .from("drawings")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);
};

export const renameDrawing = async (id: string, name: string) => {
  const { error } = await supabase
    .from("drawings")
    .update({ name })
    .eq("id", id);
  if (error) {
    throw error;
  }
};

export const deleteDrawing = async (id: string) => {
  const { error } = await supabase.from("drawings").delete().eq("id", id);
  if (error) {
    throw error;
  }
};

export const moveDrawingToFolder = async (
  id: string,
  folderId: string | null,
) => {
  const { error } = await supabase
    .from("drawings")
    .update({ folder_id: folderId })
    .eq("id", id);
  if (error) throw error;
};

// ── Folders CRUD ──────────────────────────────────────────────────────────────

export const fetchFolders = async (): Promise<Folder[]> => {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Folder[];
};

export const createFolder = async (name: string): Promise<Folder> => {
  const { data, error } = await supabase
    .from("folders")
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data as Folder;
};

export const renameFolder = async (id: string, name: string) => {
  const { error } = await supabase
    .from("folders")
    .update({ name })
    .eq("id", id);
  if (error) throw error;
};

export const deleteFolder = async (id: string) => {
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw error;
};

// ── Share link ────────────────────────────────────────────────────────────────

const SHARE_LINK_DAYS = 30;

export const generateShareLink = async (drawingId: string): Promise<string> => {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SHARE_LINK_DAYS * 86400000).toISOString();
  const { error } = await supabase
    .from("drawings")
    .update({ share_token: token, share_expires_at: expiresAt })
    .eq("id", drawingId);
  if (error) throw error;
  return `${window.location.origin}/?share=${token}`;
};

export const fetchSharedDrawing = async (token: string) => {
  const { data, error } = await supabase
    .from("drawings")
    .select("id, name, content, share_expires_at")
    .eq("share_token", token)
    .single();
  if (error) throw error;
  if (data.share_expires_at && new Date(data.share_expires_at) < new Date()) {
    throw new Error("SHARE_LINK_EXPIRED");
  }
  return data as { id: string; name: string; content: { elements: unknown[]; appState: Record<string, unknown> } };
};

export const saveThumbnail = async (id: string, thumbnail: string) => {
  const { error } = await supabase
    .from("drawings")
    .update({ thumbnail })
    .eq("id", id);
  if (error) throw error;
};

// ── Profile ───────────────────────────────────────────────────────────────────

export const fetchProfile = async (retries = 4): Promise<Profile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  for (let i = 0; i < retries; i++) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (!error && data) return data as Profile;
    // Profile row may not exist yet (trigger race on signup) — wait and retry
    if (i < retries - 1) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return null;
};

const ONBOARDING_EXTENSION_DEADLINE_DAYS = 3;

export const skipOnboarding = async (userId: string) => {
  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_done: true })
    .eq("id", userId);
  if (error) throw error;
};

export const completeOnboarding = async (
  userId: string,
  info: { full_name: string; phone: string; industry: string; use_case: string },
) => {
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("created_at, trial_ends_at")
    .eq("id", userId)
    .single();

  // If we can't read the profile we can't safely compute the bonus — fail loudly
  // so the admin panel shows the anomaly (onboarding_done stays false).
  if (fetchError || !profile?.created_at) throw fetchError ?? new Error("profile_not_found");

  const createdAt = new Date(profile.created_at).getTime();
  const daysSinceSignup = (Date.now() - createdAt) / 86400000;
  const withinDeadline = daysSinceSignup <= ONBOARDING_EXTENSION_DEADLINE_DAYS;

  // Only extend if the bonus date is actually greater than the current trial_ends_at.
  // This prevents overwriting a manually-extended trial with a shorter date.
  const bonusEndsAt = new Date(createdAt + 10 * 86400000);
  const currentEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const shouldExtend = withinDeadline && (!currentEndsAt || bonusEndsAt > currentEndsAt);

  const extra = shouldExtend
    ? { plan: "trial" as Plan, trial_ends_at: bonusEndsAt.toISOString() }
    : {};

  const { error } = await supabase
    .from("profiles")
    .update({ ...info, onboarding_done: true, ...extra })
    .eq("id", userId);
  if (error) throw error;
};

// ── Hotmart checkout ──────────────────────────────────────────────────────────

// Returns the Hotmart product page URL for the Pro plan.
// Set VITE_HOTMART_PRO_URL in your .env to your product's checkout link.
export const getHotmartCheckoutUrl = (): string => {
  const url = import.meta.env.VITE_HOTMART_PRO_URL as string | undefined;
  return url ?? "https://pay.hotmart.com/E105478979P";
};

// ── Admin: plan management ────────────────────────────────────────────────────

export type AdminProfile = Profile & { drawing_count: number };

export const fetchAllProfiles = async (): Promise<AdminProfile[]> => {
  const [{ data: profiles }, { data: drawings }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("drawings").select("user_id"),
  ]);
  const counts: Record<string, number> = {};
  (drawings || []).forEach((d: any) => {
    counts[d.user_id] = (counts[d.user_id] || 0) + 1;
  });
  return (profiles || []).map((p: any) => ({ ...p, drawing_count: counts[p.id] || 0 }));
};

export const adminSetPlan = async (
  userId: string,
  plan: Plan,
  trialDays?: number,
) => {
  const trial_ends_at =
    plan === "trial"
      ? new Date(Date.now() + (trialDays ?? 7) * 86400000).toISOString()
      : null;
  const { error } = await supabase
    .from("profiles")
    .update({ plan, trial_ends_at })
    .eq("id", userId);
  if (error) throw error;
};

export const adminFetchUserDrawings = async (userId: string): Promise<Drawing[]> => {
  const { data, error } = await supabase
    .from("drawings")
    .select("id, name, type, thumbnail, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data as Drawing[];
};

export const adminExtendTrial = async (userId: string, days: number) => {
  const { data } = await supabase
    .from("profiles")
    .select("trial_ends_at")
    .eq("id", userId)
    .single();
  const base = data?.trial_ends_at
    ? Math.max(new Date(data.trial_ends_at).getTime(), Date.now())
    : Date.now();
  const trial_ends_at = new Date(base + days * 86400000).toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({ plan: "trial", trial_ends_at })
    .eq("id", userId);
  if (error) throw error;
};


