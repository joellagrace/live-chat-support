import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// Where "View details" goes, per notification type (Cosmo account page links).
// Resolved at read time so old notifications follow any later change.
// Override with env vars NOTIF_LINK_ORDER / NOTIF_LINK_REPAIR / NOTIF_LINK_CHAT.
const LINKS: Record<string, string | undefined> = {
  order: process.env.NOTIF_LINK_ORDER || "/a/account?a=orders_page",
  repair: process.env.NOTIF_LINK_REPAIR || "/apps/repair-tracker/repairs?show=account",
  chat: process.env.NOTIF_LINK_CHAT || undefined,
};

// GET /apps/messages/notif-data  -> notifications + unread count + prefs
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  const customerId = url.searchParams.get("logged_in_customer_id");
  const shop = session?.shop || url.searchParams.get("shop");
  const headers = { "Cache-Control": "no-store" };

  if (!customerId || !shop) {
    return Response.json({ loggedIn: false }, { status: 401, headers });
  }

  const [items, unread, prefRows] = await Promise.all([
    prisma.notification.findMany({
      where: { shop, customerId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.notification.count({ where: { shop, customerId, readAt: null } }),
    prisma.notificationPref.findMany({ where: { shop, customerId } }),
  ]);

  const prefs: Record<string, boolean> = { all: true, order: true, repair: true, chat: true };
  for (const r of prefRows) prefs[r.type] = r.enabled;

  return Response.json(
    {
      loggedIn: true,
      unread,
      prefs,
      notifications: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        url: LINKS[n.type] ?? n.url,
        read: !!n.readAt,
        createdAt: n.createdAt.toISOString(),
      })),
    },
    { headers },
  );
};
