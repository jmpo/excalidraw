import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Plan types ────────────────────────────────────────────────────────────────

export type Plan = "free" | "trial" | "pro";

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

export type DrawingType = "canvas" | "mindmap";

export type Drawing = {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  type: DrawingType;
  content: { elements: unknown[]; appState: Record<string, unknown> };
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export const signInWithEmail = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUpWithEmail = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export const signOut = (opts?: { scope?: "global" | "local" | "others" }) =>
  supabase.auth.signOut(opts);

export const resetPasswordForEmail = (email: string) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/?reset_password=1`,
  });

export const getSession = () => supabase.auth.getSession();

// ── Drawings CRUD ─────────────────────────────────────────────────────────────

export const fetchDrawings = async (): Promise<Drawing[]> => {
  const { data, error } = await supabase
    .from("drawings")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    throw error;
  }
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

export const generateShareLink = async (drawingId: string): Promise<string> => {
  const token = crypto.randomUUID();
  const { error } = await supabase
    .from("drawings")
    .update({ share_token: token })
    .eq("id", drawingId);
  if (error) throw error;
  return `${window.location.origin}/?share=${token}`;
};

export const fetchSharedDrawing = async (token: string) => {
  const { data, error } = await supabase
    .from("drawings")
    .select("id, name, content")
    .eq("share_token", token)
    .single();
  if (error) throw error;
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

export const fetchProfile = async (): Promise<Profile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) return null;
  return data as Profile;
};

export const completeOnboarding = async (
  userId: string,
  info: { full_name: string; phone: string; industry: string; use_case: string },
) => {
  const trialEnd = new Date(Date.now() + 7 * 86400000).toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      ...info,
      plan: "trial",
      trial_ends_at: trialEnd,
      onboarding_done: true,
    })
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

