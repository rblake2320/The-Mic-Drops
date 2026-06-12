// Base URL for API calls.
// In dev: empty string (same origin, Vite proxy handles it).
// In production with Cloudflare Pages: set VITE_API_URL env var to the VPS API origin.
export const API_BASE: string = (import.meta as any).env?.VITE_API_URL ?? "";

export async function registerPushSubscription(token: string, subscription: PushSubscriptionJSON): Promise<void> {
  await fetch(`${API_BASE}/api/consumer/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      auth: subscription.keys?.auth,
      p256dh: subscription.keys?.p256dh,
    }),
  });
}

export async function subscribeToPushNotifications(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    const key = urlBase64ToUint8Array(vapidPublicKey);
    return await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    });
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
