import { supabase } from "./supabase";

const STORAGE_KEY = "edudraw_guest_id";

function getOrCreateGuestId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export async function trackGuestSessionStart(tool: "canvas" | "mindmap" = "canvas"): Promise<void> {
  const sessionId = getOrCreateGuestId();
  await supabase.from("guest_sessions").upsert(
    {
      session_id: sessionId,
      last_active: new Date().toISOString(),
      tool,
    },
    { onConflict: "session_id" },
  ).then(({ error }) => {
    if (error) console.error("Guest tracking error:", error.message, error);
  });
}

export async function trackGuestToolSwitch(tool: "canvas" | "mindmap"): Promise<void> {
  const sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId) return;
  await supabase.from("guest_sessions").update({
    last_active: new Date().toISOString(),
    tool,
  }).eq("session_id", sessionId).then(({ error }) => {
    if (error) console.warn("Guest tracking error:", error.message);
  });
}

export async function trackGuestActivity(elementCount: number): Promise<void> {
  const sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId) return;
  await supabase.from("guest_sessions").update({
    last_active: new Date().toISOString(),
    element_count: elementCount,
  }).eq("session_id", sessionId).then(({ error }) => {
    if (error) console.warn("Guest tracking error:", error.message);
  });
}
