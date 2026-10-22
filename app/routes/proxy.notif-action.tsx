import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// POST /apps/messages/notif-action
// JSON: { action: "read", id } | { action: "read_all" } | { action: "pref", type, enabled }
const PREF_TYPES = ["all", "order", "repair", "chat"];

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  const customerId = url.searchParams.get("logged_in_customer_id");
  const shop = session?.shop || url.searchParams.get("shop");

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  if (!customerId || !shop) {
    return Response.json({ error: "Please log in." }, { status: 401 });
  }

  const p: any = await request.json().catch(() => null);
  if (!p || typeof p.action !== "string") {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  if (p.action === "read" && typeof p.id === "string") {
    // customerId in the where clause = a customer can only touch their own rows
    await prisma.notification.updateMany({
      where: { id: p.id, shop, customerId, readAt: null },
      data: { readAt: new Date() },
    });
  } else if (p.action === "read_all") {
    await prisma.notification.updateMany({
      where: { shop, customerId, readAt: null },
      data: { readAt: new Date() },
    });
  } else if (p.action === "pref" && PREF_TYPES.includes(p.type) && typeof p.enabled === "boolean") {
    await prisma.notificationPref.upsert({
      where: { shop_customerId_type: { shop, customerId, type: p.type } },
      create: { shop, customerId, type: p.type, enabled: p.enabled },
      update: { enabled: p.enabled },
    });
  } else {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const unread = await prisma.notification.count({ where: { shop, customerId, readAt: null } });
  return Response.json({ ok: true, unread }, { headers: { "Cache-Control": "no-store" } });
};
