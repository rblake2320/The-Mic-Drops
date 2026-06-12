import webpush from "web-push";
import { db } from "../db.js";

let vapidReady = false;

export function initVapid(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL ?? "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    console.warn("[Push] VAPID keys not configured — web push disabled. Run: npm run vapid:generate");
    return false;
  }

  webpush.setVapidDetails(email, publicKey, privateKey);
  vapidReady = true;
  console.log("[Push] VAPID initialized");
  return true;
}

export async function sendPushToSubscription(
  endpoint: string,
  auth: string,
  p256dh: string,
  payload: object
): Promise<boolean> {
  if (!vapidReady) return false;
  try {
    await webpush.sendNotification(
      { endpoint, keys: { auth, p256dh } },
      JSON.stringify(payload),
      { TTL: 86400 }
    );
    return true;
  } catch (err: any) {
    // Subscription expired or invalid — clean up
    if (err.statusCode === 410 || err.statusCode === 404) {
      await db.consumer
        .updateMany({
          where: { pushEndpoint: endpoint },
          data: { pushEndpoint: null, pushAuth: null, pushP256dh: null },
        })
        .catch(() => null);
    }
    return false;
  }
}

export async function sendDropToSubscribers(dropId: string): Promise<void> {
  const drop = await db.drop.findUnique({
    where: { id: dropId },
    include: { creator: true },
  });
  if (!drop) return;

  const subscriptions = await db.subscription.findMany({
    where: { creatorId: drop.creatorId, status: "ACTIVE" },
    include: { consumer: true },
  });

  const pushTargets = subscriptions.filter(
    (s) => s.consumer.pushEndpoint && s.consumer.pushAuth && s.consumer.pushP256dh
  );

  if (pushTargets.length === 0) {
    console.log(`[Push] Drop ${dropId}: no push subscribers`);
    return;
  }

  const payload = {
    title: `${drop.creator.name}: ${drop.title}`,
    body: drop.content.slice(0, 120) + (drop.content.length > 120 ? "…" : ""),
    icon: drop.creator.avatarUrl,
    data: { dropId: drop.id, creatorId: drop.creatorId, url: "/" },
  };

  const results = await Promise.allSettled(
    pushTargets.map((s) =>
      sendPushToSubscription(
        s.consumer.pushEndpoint!,
        s.consumer.pushAuth!,
        s.consumer.pushP256dh!,
        payload
      )
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled" && (r as any).value).length;
  console.log(`[Push] Drop ${dropId}: sent to ${sent}/${pushTargets.length} subscribers`);

  await db.analyticsEvent
    .create({
      data: {
        type: "push_sent",
        creatorId: drop.creatorId,
        dropId: drop.id,
        metadata: { sent, total: pushTargets.length },
      },
    })
    .catch(() => null);
}
