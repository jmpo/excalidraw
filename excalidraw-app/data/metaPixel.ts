// Browser-side Meta Pixel helper
// All events are also sent server-side via CAPI for dual-tracking

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string;

// Generate a unique event ID for deduplication between pixel and CAPI
const genEventId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Read Facebook browser cookies for user matching
const getFbp = () => {
  const m = document.cookie.match(/_fbp=([^;]+)/);
  return m ? m[1] : undefined;
};
const getFbc = () => {
  const m = document.cookie.match(/_fbc=([^;]+)/);
  if (m) return m[1];
  const urlM = window.location.search.match(/[?&]fbclid=([^&]+)/);
  return urlM ? `fb.1.${Date.now()}.${urlM[1]}` : undefined;
};

// Fire pixel event (browser) + CAPI (server) simultaneously
export const trackEvent = async (
  eventName: string,
  customData: Record<string, unknown> = {},
  userData: { email?: string; firstName?: string } = {},
) => {
  const eventId = genEventId();

  // 1. Browser pixel
  if (window.fbq) {
    window.fbq("track", eventName, customData, { eventID: eventId });
  }

  // 2. Server-side CAPI (fire-and-forget)
  fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-capi`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        eventName,
        eventId,
        customData,
        userData: {
          ...userData,
          fbp: getFbp(),
          fbc: getFbc(),
          userAgent: navigator.userAgent,
          pageUrl: window.location.href,
        },
      }),
    },
  ).catch(() => {}); // never block the UI
};

// Convenience methods
export const pixelPageView    = () => trackEvent("PageView");
export const pixelLead        = (email?: string) => trackEvent("Lead", {}, { email });
export const pixelRegistration = (email?: string) => trackEvent("CompleteRegistration", { status: true }, { email });
export const pixelPurchase    = (value: number, currency = "USD") =>
  trackEvent("Purchase", { value, currency });
export const pixelInitCheckout = () => trackEvent("InitiateCheckout");
