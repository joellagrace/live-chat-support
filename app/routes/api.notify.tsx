import type { ActionFunctionArgs } from "react-router";
import { timingSafeEqual } from "node:crypto";
import {
  createNotification,
  NOTIFICATION_TYPES,
  type NotificationType,
} from "../utils/notify.server";

// Server-to-server endpoint used by the Repair app (and others).
// POST /api/notify   Authorization: Bearer <NOTIFY_SECRET>
// JSON: { shop, customerId, type, title, body, url?, dedupeKey? }

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const secret = process.env.NOTIFY_SECRET;
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!secret || !token || !safeEqual(token, secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const p: any = await request.json().catch(() => null);
  if (
    !p ||
    typeof p.shop !== "string" ||
    typeof p.title !== "string" ||
    typeof p.body !== "string" ||
    !NOTIFICATION_TYPES.includes(p.type)
  ) {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const result = await createNotification({
    shop: p.shop,
    customerId: p.customerId,
    type: p.type as NotificationType,
    title: p.title,
    body: p.body,
    url: typeof p.url === "string" ? p.url : null,
    dedupeKey: typeof p.dedupeKey === "string" ? p.dedupeKey : null,
  });
  return Response.json({ ok: true, ...result });
};
