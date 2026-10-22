import prisma from "../db.server";

export const NOTIFICATION_TYPES = ["repair", "order", "chat"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// "gid://shopify/Customer/123" or 123 -> "123"
export function normalizeCustomerId(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  const m = s.match(/(\d{1,20})$/);
  return m ? m[1] : null;
}

function clip(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// Creates a notification unless the customer turned that type off.
// Never throws: callers (repair status, chat, webhooks) must not break
// if a notification can't be stored.
export async function createNotification(opts: {
  shop: string;
  customerId: unknown;
  type: NotificationType;
  title: string;
  body: string;
  url?: string | null;
  dedupeKey?: string | null;
}): Promise<{ created: boolean }> {
  try {
    const customerId = normalizeCustomerId(opts.customerId);
    if (!customerId || !opts.shop) return { created: false };

    const off = await prisma.notificationPref.findFirst({
      where: {
        shop: opts.shop,
        customerId,
        enabled: false,
        type: { in: ["all", opts.type] },
      },
    });
    if (off) return { created: false };

    await prisma.notification.create({
      data: {
        shop: opts.shop,
        customerId,
        type: opts.type,
        title: clip(opts.title, 140),
        body: clip(opts.body, 500),
        url: opts.url ? clip(opts.url, 500) : null,
        dedupeKey: opts.dedupeKey ? clip(opts.dedupeKey, 200) : null,
      },
    });
    return { created: true };
  } catch (e: any) {
    // P2002 = unique violation: same event delivered twice. Ignore quietly.
    if (e?.code !== "P2002") console.error("createNotification failed", e);
    return { created: false };
  }
}
